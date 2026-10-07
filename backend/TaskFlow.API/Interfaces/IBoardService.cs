using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskFlow.API.DTOs;

namespace TaskFlow.API.Interfaces;

public interface IBoardService
{
    Task<IEnumerable<BoardDto>> GetByWorkspaceIdAsync(Guid workspaceId, Guid userId);
    Task<BoardDto?> GetByIdAsync(Guid id, Guid userId);
    Task<BoardDto> CreateAsync(CreateBoardDto dto, Guid userId);
    Task<BoardDto?> UpdateAsync(Guid id, UpdateBoardDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
