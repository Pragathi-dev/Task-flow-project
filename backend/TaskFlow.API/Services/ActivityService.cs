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

public class ActivityService : IActivityService
{
    private readonly TaskFlowDbContext _context;

    public ActivityService(TaskFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ActivityDto>> GetAllAsync(Guid userId)
    {
        var activities = await _context.Activities
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        return activities.Select(MapToDto);
    }

    public async Task<IEnumerable<ActivityDto>> GetByWorkspaceIdAsync(Guid workspaceId, Guid userId)
    {
        var activities = await _context.Activities
            .AsNoTracking()
            .Where(a => a.WorkspaceId == workspaceId && a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        return activities.Select(MapToDto);
    }

    public async Task<IEnumerable<ActivityDto>> GetByTaskIdAsync(Guid taskId, Guid userId)
    {
        var activities = await _context.Activities
            .AsNoTracking()
            .Where(a => a.EntityId == taskId && a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        return activities.Select(MapToDto);
    }

    public async Task RecordActivityAsync(CreateActivityDto dto, Guid userId)
    {
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            WorkspaceId = dto.WorkspaceId,
            BoardId = dto.BoardId,
            ColumnId = dto.ColumnId,
            EntityId = dto.EntityId,
            EventType = dto.EventType,
            EntityTitle = dto.EntityTitle,
            MetaJson = dto.Meta != null ? dto.Meta.ToJsonString() : null,
            Timestamp = DateTime.UtcNow
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();
    }

    private static ActivityDto MapToDto(Activity entity)
    {
        JsonNode? metaNode = null;
        if (!string.IsNullOrEmpty(entity.MetaJson))
        {
            try
            {
                metaNode = JsonNode.Parse(entity.MetaJson);
            }
            catch
            {
                // Fallback for invalid JSON string
            }
        }

        return new ActivityDto
        {
            Id = entity.Id,
            EventType = entity.EventType,
            EntityId = entity.EntityId,
            EntityTitle = entity.EntityTitle,
            WorkspaceId = entity.WorkspaceId,
            BoardId = entity.BoardId,
            ColumnId = entity.ColumnId,
            Meta = metaNode,
            Timestamp = entity.Timestamp
        };
    }
}
