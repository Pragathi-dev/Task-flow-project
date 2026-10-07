using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Interfaces;

namespace TaskFlow.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    private Guid CurrentUserId
    {
        get
        {
            var claimVal = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
            if (Guid.TryParse(claimVal, out var id)) return id;
            return TaskFlowDbContext.DefaultUserId;
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ActivityDto>), 200)]
    public async Task<ActionResult<IEnumerable<ActivityDto>>> GetAll()
    {
        var result = await _activityService.GetAllAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpGet("workspace/{workspaceId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<ActivityDto>), 200)]
    public async Task<ActionResult<IEnumerable<ActivityDto>>> GetByWorkspace(Guid workspaceId)
    {
        var result = await _activityService.GetByWorkspaceIdAsync(workspaceId, CurrentUserId);
        return Ok(result);
    }

    [HttpGet("task/{taskId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<ActivityDto>), 200)]
    public async Task<ActionResult<IEnumerable<ActivityDto>>> GetByTask(Guid taskId)
    {
        var result = await _activityService.GetByTaskIdAsync(taskId, CurrentUserId);
        return Ok(result);
    }
}
