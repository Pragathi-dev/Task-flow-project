using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Entities;
using TaskFlow.API.Interfaces;

namespace TaskFlow.API.Services;

public class WorkspaceService : IWorkspaceService
{
    private readonly TaskFlowDbContext _context;
    private readonly IActivityService _activityService;

    public WorkspaceService(TaskFlowDbContext context, IActivityService activityService)
    {
        _context = context;
        _activityService = activityService;
    }

    public async Task<IEnumerable<WorkspaceDto>> GetAllAsync(Guid userId)
    {
        var workspaces = await _context.Workspaces
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .Include(w => w.Boards)
            .OrderBy(w => w.CreatedAt)
            .ToListAsync();

        return workspaces.Select(MapToDto);
    }

    public async Task<WorkspaceDto?> GetByIdAsync(Guid id, Guid userId)
    {
        var workspace = await _context.Workspaces
            .AsNoTracking()
            .Where(w => w.Id == id && w.UserId == userId)
            .Include(w => w.Boards)
            .FirstOrDefaultAsync();

        return workspace != null ? MapToDto(workspace) : null;
    }

    public async Task<WorkspaceDto> CreateAsync(CreateWorkspaceDto dto, Guid userId)
    {
        var workspace = new Workspace
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = dto.Name.Trim(),
            Color = dto.Color ?? "#3b82f6",
            Icon = dto.Icon ?? "🚀",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync();

        await _activityService.RecordActivityAsync(new CreateActivityDto
        {
            EventType = "workspace_created",
            EntityId = workspace.Id,
            EntityTitle = workspace.Name,
            WorkspaceId = workspace.Id
        }, userId);

        return MapToDto(workspace);
    }

    public async Task<WorkspaceDto?> UpdateAsync(Guid id, UpdateWorkspaceDto dto, Guid userId)
    {
        var workspace = await _context.Workspaces
            .Where(w => w.Id == id && w.UserId == userId)
            .Include(w => w.Boards)
            .FirstOrDefaultAsync();

        if (workspace == null) return null;

        if (dto.Name != null) workspace.Name = dto.Name.Trim();
        if (dto.Color != null) workspace.Color = dto.Color;
        if (dto.Icon != null) workspace.Icon = dto.Icon;
        workspace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(workspace);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var workspace = await _context.Workspaces
            .Where(w => w.Id == id && w.UserId == userId)
            .FirstOrDefaultAsync();

        if (workspace == null) return false;

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync();

        return true;
    }

    private static WorkspaceDto MapToDto(Workspace entity)
    {
        return new WorkspaceDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Color = entity.Color,
            Icon = entity.Icon,
            BoardIds = entity.Boards?.Select(b => b.Id).ToList() ?? new List<Guid>(),
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
