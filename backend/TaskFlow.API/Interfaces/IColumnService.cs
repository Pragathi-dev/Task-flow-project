using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskFlow.API.DTOs;

namespace TaskFlow.API.Interfaces;

public interface IColumnService
{
    Task<IEnumerable<ColumnDto>> GetByBoardIdAsync(Guid boardId, Guid userId);
    Task<ColumnDto?> GetByIdAsync(Guid id, Guid userId);
    Task<ColumnDto> CreateAsync(CreateColumnDto dto, Guid userId);
    Task<ColumnDto?> UpdateAsync(Guid id, UpdateColumnDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<bool> ReorderAsync(Guid boardId, List<Guid> columnIds, Guid userId);
}
