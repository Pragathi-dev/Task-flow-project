using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskFlow.API.DTOs;

namespace TaskFlow.API.Interfaces;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetByBoardIdAsync(Guid boardId, Guid userId);
    Task<TaskDto?> GetByIdAsync(Guid id, Guid userId);
    Task<TaskDto> CreateAsync(CreateTaskDto dto, Guid userId);
    Task<TaskDto?> UpdateAsync(Guid id, UpdateTaskDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<TaskDto?> MoveTaskAsync(Guid id, MoveTaskDto dto, Guid userId);
    Task<TaskDto?> ToggleCompleteAsync(Guid id, Guid userId);

    // Checklist
    Task<ChecklistItemDto?> AddChecklistItemAsync(Guid taskId, CreateChecklistItemDto dto, Guid userId);
    Task<ChecklistItemDto?> UpdateChecklistItemAsync(Guid itemId, UpdateChecklistItemDto dto, Guid userId);
    Task<bool> DeleteChecklistItemAsync(Guid itemId, Guid userId);

    // Comments
    Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid taskId, Guid userId);
    Task<CommentDto?> AddCommentAsync(Guid taskId, CreateCommentDto dto, Guid userId);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId);
}
