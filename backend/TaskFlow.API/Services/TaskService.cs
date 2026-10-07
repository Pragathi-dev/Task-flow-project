using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Entities;
using TaskFlow.API.Interfaces;

namespace TaskFlow.API.Services;

public class TaskService : ITaskService
{
    private readonly TaskFlowDbContext _context;
    private readonly IActivityService _activityService;

    public TaskService(TaskFlowDbContext context, IActivityService activityService)
    {
        _context = context;
        _activityService = activityService;
    }

    public async Task<IEnumerable<TaskDto>> GetByBoardIdAsync(Guid boardId, Guid userId)
    {
        var tasks = await _context.Tasks
            .AsNoTracking()
            .Where(t => t.BoardId == boardId && t.UserId == userId)
            .Include(t => t.ChecklistItems)
            .Include(t => t.Comments)
            .OrderBy(t => t.Order)
            .ToListAsync();

        return tasks.Select(MapToDto);
    }

    public async Task<TaskDto?> GetByIdAsync(Guid id, Guid userId)
    {
        var task = await _context.Tasks
            .AsNoTracking()
            .Where(t => t.Id == id && t.UserId == userId)
            .Include(t => t.ChecklistItems)
            .Include(t => t.Comments)
            .FirstOrDefaultAsync();

        return task != null ? MapToDto(task) : null;
    }

    public async Task<TaskDto> CreateAsync(CreateTaskDto dto, Guid userId)
    {
        var column = await _context.Columns
            .FirstOrDefaultAsync(c => c.Id == dto.ColumnId && c.UserId == userId);

        if (column == null)
        {
            throw new InvalidOperationException($"Column {dto.ColumnId} not found.");
        }

        var existingCount = await _context.Tasks
            .CountAsync(t => t.ColumnId == dto.ColumnId);

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            ColumnId = dto.ColumnId,
            BoardId = dto.BoardId,
            WorkspaceId = dto.WorkspaceId,
            UserId = userId,
            Title = dto.Title.Trim(),
            Description = dto.Description,
            Priority = dto.Priority ?? "medium",
            LabelsJson = JsonSerializer.Serialize(dto.Labels ?? new List<string>()),
            DueDate = dto.DueDate,
            EstimatedHours = dto.EstimatedHours,
            Order = existingCount,
            CompletedAt = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        await _activityService.RecordActivityAsync(new CreateActivityDto
        {
            EventType = "task_created",
            EntityId = task.Id,
            EntityTitle = task.Title,
            WorkspaceId = task.WorkspaceId,
            BoardId = task.BoardId,
            ColumnId = task.ColumnId
        }, userId);

        return MapToDto(task);
    }

    public async Task<TaskDto?> UpdateAsync(Guid id, UpdateTaskDto dto, Guid userId)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == id && t.UserId == userId)
            .Include(t => t.ChecklistItems)
            .Include(t => t.Comments)
            .FirstOrDefaultAsync();

        if (task == null) return null;

        if (dto.Title != null) task.Title = dto.Title.Trim();
        if (dto.Description != null) task.Description = dto.Description;
        if (dto.Priority != null) task.Priority = dto.Priority;
        if (dto.Labels != null) task.LabelsJson = JsonSerializer.Serialize(dto.Labels);
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate.Value;
        if (dto.EstimatedHours.HasValue) task.EstimatedHours = dto.EstimatedHours.Value;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync();

        if (task == null) return false;

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        await _activityService.RecordActivityAsync(new CreateActivityDto
        {
            EventType = "task_deleted",
            EntityId = task.Id,
            EntityTitle = task.Title,
            WorkspaceId = task.WorkspaceId,
            BoardId = task.BoardId,
            ColumnId = task.ColumnId
        }, userId);

        return true;
    }

    public async Task<TaskDto?> MoveTaskAsync(Guid id, MoveTaskDto dto, Guid userId)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == id && t.UserId == userId)
            .Include(t => t.ChecklistItems)
            .Include(t => t.Comments)
            .FirstOrDefaultAsync();

        if (task == null) return null;

        var fromColumnId = task.ColumnId;
        var toColumnId = dto.DestinationColumnId;

        task.ColumnId = toColumnId;
        task.Order = dto.NewOrder;
        task.UpdatedAt = DateTime.UtcNow;

        // Reorder tasks in destination column
        var destTasks = await _context.Tasks
            .Where(t => t.ColumnId == toColumnId && t.Id != id)
            .OrderBy(t => t.Order)
            .ToListAsync();

        destTasks.Insert(Math.Min(dto.NewOrder, destTasks.Count), task);

        for (int i = 0; i < destTasks.Count; i++)
        {
            destTasks[i].Order = i;
        }

        await _context.SaveChangesAsync();

        await _activityService.RecordActivityAsync(new CreateActivityDto
        {
            EventType = "task_moved",
            EntityId = task.Id,
            EntityTitle = task.Title,
            WorkspaceId = task.WorkspaceId,
            BoardId = task.BoardId,
            ColumnId = toColumnId,
            Meta = new JsonObject
            {
                ["fromColumnId"] = fromColumnId.ToString(),
                ["toColumnId"] = toColumnId.ToString()
            }
        }, userId);

        return MapToDto(task);
    }

    public async Task<TaskDto?> ToggleCompleteAsync(Guid id, Guid userId)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == id && t.UserId == userId)
            .Include(t => t.ChecklistItems)
            .Include(t => t.Comments)
            .FirstOrDefaultAsync();

        if (task == null) return null;

        bool isCompleting = task.CompletedAt == null;
        task.CompletedAt = isCompleting ? DateTime.UtcNow : null;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _activityService.RecordActivityAsync(new CreateActivityDto
        {
            EventType = isCompleting ? "task_completed" : "task_reopened",
            EntityId = task.Id,
            EntityTitle = task.Title,
            WorkspaceId = task.WorkspaceId,
            BoardId = task.BoardId,
            ColumnId = task.ColumnId
        }, userId);

        return MapToDto(task);
    }

    // Checklist Operations
    public async Task<ChecklistItemDto?> AddChecklistItemAsync(Guid taskId, CreateChecklistItemDto dto, Guid userId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task == null) return null;

        var existingCount = await _context.ChecklistItems.CountAsync(c => c.TaskId == taskId);

        var item = new ChecklistItem
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            Text = dto.Text.Trim(),
            Completed = false,
            Order = dto.Order > 0 ? dto.Order : existingCount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChecklistItems.Add(item);
        await _context.SaveChangesAsync();

        return new ChecklistItemDto
        {
            Id = item.Id,
            TaskId = item.TaskId,
            Text = item.Text,
            Completed = item.Completed,
            Order = item.Order,
            CreatedAt = item.CreatedAt
        };
    }

    public async Task<ChecklistItemDto?> UpdateChecklistItemAsync(Guid itemId, UpdateChecklistItemDto dto, Guid userId)
    {
        var item = await _context.ChecklistItems
            .Include(ci => ci.Task)
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.Task!.UserId == userId);

        if (item == null) return null;

        if (dto.Text != null) item.Text = dto.Text.Trim();
        if (dto.Completed.HasValue) item.Completed = dto.Completed.Value;
        if (dto.Order.HasValue) item.Order = dto.Order.Value;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ChecklistItemDto
        {
            Id = item.Id,
            TaskId = item.TaskId,
            Text = item.Text,
            Completed = item.Completed,
            Order = item.Order,
            CreatedAt = item.CreatedAt
        };
    }

    public async Task<bool> DeleteChecklistItemAsync(Guid itemId, Guid userId)
    {
        var item = await _context.ChecklistItems
            .Include(ci => ci.Task)
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.Task!.UserId == userId);

        if (item == null) return false;

        _context.ChecklistItems.Remove(item);
        await _context.SaveChangesAsync();

        return true;
    }

    // Comments Operations
    public async Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid taskId, Guid userId)
    {
        var comments = await _context.Comments
            .AsNoTracking()
            .Where(c => c.TaskId == taskId && c.UserId == userId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(c => new CommentDto
        {
            Id = c.Id,
            TaskId = c.TaskId,
            UserId = c.UserId,
            Text = c.Text,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<CommentDto?> AddCommentAsync(Guid taskId, CreateCommentDto dto, Guid userId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task == null) return null;

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            UserId = userId,
            Text = dto.Text.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        return new CommentDto
        {
            Id = comment.Id,
            TaskId = comment.TaskId,
            UserId = comment.UserId,
            Text = comment.Text,
            CreatedAt = comment.CreatedAt
        };
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _context.Comments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.UserId == userId);

        if (comment == null) return false;

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        return true;
    }

    private static TaskDto MapToDto(TaskItem entity)
    {
        List<string> labels = new();
        if (!string.IsNullOrEmpty(entity.LabelsJson))
        {
            try { labels = JsonSerializer.Deserialize<List<string>>(entity.LabelsJson) ?? new(); } catch { }
        }

        return new TaskDto
        {
            Id = entity.Id,
            Title = entity.Title,
            Description = entity.Description,
            Priority = entity.Priority,
            Labels = labels,
            DueDate = entity.DueDate,
            EstimatedHours = entity.EstimatedHours,
            Order = entity.Order,
            CompletedAt = entity.CompletedAt,
            ColumnId = entity.ColumnId,
            BoardId = entity.BoardId,
            WorkspaceId = entity.WorkspaceId,
            Checklist = entity.ChecklistItems?.OrderBy(ci => ci.Order).Select(ci => new ChecklistItemDto
            {
                Id = ci.Id,
                TaskId = ci.TaskId,
                Text = ci.Text,
                Completed = ci.Completed,
                Order = ci.Order,
                CreatedAt = ci.CreatedAt
            }).ToList() ?? new(),
            Comments = entity.Comments?.OrderBy(c => c.CreatedAt).Select(c => new CommentDto
            {
                Id = c.Id,
                TaskId = c.TaskId,
                UserId = c.UserId,
                Text = c.Text,
                CreatedAt = c.CreatedAt
            }).ToList() ?? new(),
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
