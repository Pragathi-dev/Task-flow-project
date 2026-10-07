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

public class ColumnService : IColumnService
{
    private readonly TaskFlowDbContext _context;

    public ColumnService(TaskFlowDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ColumnDto>> GetByBoardIdAsync(Guid boardId, Guid userId)
    {
        var columns = await _context.Columns
            .AsNoTracking()
            .Where(c => c.BoardId == boardId && c.UserId == userId)
            .Include(c => c.Tasks)
            .OrderBy(c => c.Order)
            .ToListAsync();

        return columns.Select(MapToDto);
    }

    public async Task<ColumnDto?> GetByIdAsync(Guid id, Guid userId)
    {
        var column = await _context.Columns
            .AsNoTracking()
            .Where(c => c.Id == id && c.UserId == userId)
            .Include(c => c.Tasks)
            .FirstOrDefaultAsync();

        return column != null ? MapToDto(column) : null;
    }

    public async Task<ColumnDto> CreateAsync(CreateColumnDto dto, Guid userId)
    {
        var board = await _context.Boards
            .FirstOrDefaultAsync(b => b.Id == dto.BoardId && b.UserId == userId);

        if (board == null)
        {
            throw new InvalidOperationException($"Board {dto.BoardId} not found.");
        }

        var existingCount = await _context.Columns
            .CountAsync(c => c.BoardId == dto.BoardId);

        var column = new ColumnEntity
        {
            Id = Guid.NewGuid(),
            BoardId = dto.BoardId,
            UserId = userId,
            Name = dto.Name.Trim(),
            Order = dto.Order > 0 ? dto.Order : existingCount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Columns.Add(column);
        await _context.SaveChangesAsync();

        return MapToDto(column);
    }

    public async Task<ColumnDto?> UpdateAsync(Guid id, UpdateColumnDto dto, Guid userId)
    {
        var column = await _context.Columns
            .Where(c => c.Id == id && c.UserId == userId)
            .Include(c => c.Tasks)
            .FirstOrDefaultAsync();

        if (column == null) return null;

        if (dto.Name != null) column.Name = dto.Name.Trim();
        if (dto.Order.HasValue) column.Order = dto.Order.Value;
        column.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(column);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var column = await _context.Columns
            .Where(c => c.Id == id && c.UserId == userId)
            .FirstOrDefaultAsync();

        if (column == null) return false;

        _context.Columns.Remove(column);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ReorderAsync(Guid boardId, List<Guid> columnIds, Guid userId)
    {
        var columns = await _context.Columns
            .Where(c => c.BoardId == boardId && c.UserId == userId)
            .ToListAsync();

        if (columns.Count == 0) return false;

        for (int i = 0; i < columnIds.Count; i++)
        {
            var col = columns.FirstOrDefault(c => c.Id == columnIds[i]);
            if (col != null)
            {
                col.Order = i;
                col.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static ColumnDto MapToDto(ColumnEntity entity)
    {
        return new ColumnDto
        {
            Id = entity.Id,
            BoardId = entity.BoardId,
            Name = entity.Name,
            Order = entity.Order,
            TaskIds = entity.Tasks?.OrderBy(t => t.Order).Select(t => t.Id).ToList() ?? new List<Guid>(),
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
