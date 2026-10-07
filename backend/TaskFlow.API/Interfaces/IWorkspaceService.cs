using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskFlow.API.DTOs;

namespace TaskFlow.API.Interfaces;

public interface IWorkspaceService
{
    Task<IEnumerable<WorkspaceDto>> GetAllAsync(Guid userId);
    Task<WorkspaceDto?> GetByIdAsync(Guid id, Guid userId);
    Task<WorkspaceDto> CreateAsync(CreateWorkspaceDto dto, Guid userId);
    Task<WorkspaceDto?> UpdateAsync(Guid id, UpdateWorkspaceDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
