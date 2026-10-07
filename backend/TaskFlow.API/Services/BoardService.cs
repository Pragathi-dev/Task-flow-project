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

public class BoardService : IBoardService
{
    private readonly TaskFlowDbContext _context;
    private readonly IActivityService _activityService;

    public BoardService(TaskFlowDbContext context, IActivityService activityService)
    {
        _context = context;
        _activityService = activityService;
    }

    public async Task<IEnumerable<BoardDto>> GetByWorkspaceIdAsync(Guid workspaceId, Guid userId)
    {
        var boards = await _context.Boards
            .AsNoTracking()
            .Where(b => b.WorkspaceId == workspaceId && b.UserId == userId)
            .Include(b => b.Columns)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        return boards.Select(MapToDto);
    }

    public async Task<BoardDto?> GetByIdAsync(Guid id, Guid userId)
    {
        var board = await _context.Boards
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == userId)
            .Include(b => b.Columns)
            .FirstOrDefaultAsync();

        return board != null ? MapToDto(board) : null;
    }

    public async Task<BoardDto> CreateAsync(CreateBoardDto dto, Guid userId)
    {
        var workspaceExists = await _context.Workspaces
            .AnyAsync(w => w.Id == dto.WorkspaceId && w.UserId == userId);

        if (!workspaceExists)
        {
            throw new InvalidOperationException($"Workspace {dto.WorkspaceId} not found.");
        }

        var board = new Board
        {
            Id = Guid.NewGuid(),
            WorkspaceId = dto.WorkspaceId,
            UserId = userId,
            Name = dto.Name.Trim(),
            Color = dto.Color,
            Icon = dto.Icon,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Auto-seed standard default columns: "To Do", "In Progress", "Done"
        var defaultColumns = new[]
        {
            new ColumnEntity { Id = Guid.NewGuid(), BoardId = board.Id, UserId = userId, Name = "To Do", Order = 0, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new ColumnEntity { Id = Guid.NewGuid(), BoardId = board.Id, UserId = userId, Name = "In Progress", Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new ColumnEntity { Id = Guid.NewGuid(), BoardId = board.Id, UserId = userId, Name = "Done", Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        board.Columns = defaultColumns;

        _context.Boards.Add(board);
        await _context.SaveChangesAsync();

        await _activityService.RecordActivityAsync(new CreateActivityDto
        {
            EventType = "board_created",
            EntityId = board.Id,
            EntityTitle = board.Name,
            WorkspaceId = board.WorkspaceId,
            BoardId = board.Id
        }, userId);

        return MapToDto(board);
    }

    public async Task<BoardDto?> UpdateAsync(Guid id, UpdateBoardDto dto, Guid userId)
    {
        var board = await _context.Boards
            .Where(b => b.Id == id && b.UserId == userId)
            .Include(b => b.Columns)
            .FirstOrDefaultAsync();

        if (board == null) return null;

        if (dto.Name != null) board.Name = dto.Name.Trim();
        if (dto.Color != null) board.Color = dto.Color;
        if (dto.Icon != null) board.Icon = dto.Icon;
        board.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(board);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var board = await _context.Boards
            .Where(b => b.Id == id && b.UserId == userId)
            .FirstOrDefaultAsync();

        if (board == null) return false;

        _context.Boards.Remove(board);
        await _context.SaveChangesAsync();

        return true;
    }

    private static BoardDto MapToDto(Board entity)
    {
        return new BoardDto
        {
            Id = entity.Id,
            WorkspaceId = entity.WorkspaceId,
            Name = entity.Name,
            Color = entity.Color,
            Icon = entity.Icon,
            ColumnIds = entity.Columns?.OrderBy(c => c.Order).Select(c => c.Id).ToList() ?? new List<Guid>(),
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
