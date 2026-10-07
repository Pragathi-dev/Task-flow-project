using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskFlow.API.DTOs;

namespace TaskFlow.API.Interfaces;

public interface IActivityService
{
    Task<IEnumerable<ActivityDto>> GetAllAsync(Guid userId);
    Task<IEnumerable<ActivityDto>> GetByWorkspaceIdAsync(Guid workspaceId, Guid userId);
    Task<IEnumerable<ActivityDto>> GetByTaskIdAsync(Guid taskId, Guid userId);
    Task RecordActivityAsync(CreateActivityDto dto, Guid userId);
}
