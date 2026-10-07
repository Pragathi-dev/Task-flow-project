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
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspacesController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
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
    [ProducesResponseType(typeof(IEnumerable<WorkspaceDto>), 200)]
    public async Task<ActionResult<IEnumerable<WorkspaceDto>>> GetAll()
    {
        var result = await _workspaceService.GetAllAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkspaceDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<WorkspaceDto>> GetById(Guid id)
    {
        var result = await _workspaceService.GetByIdAsync(id, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Workspace {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<WorkspaceDto>> Create([FromBody] CreateWorkspaceDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _workspaceService.CreateAsync(dto, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(WorkspaceDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<WorkspaceDto>> Update(Guid id, [FromBody] UpdateWorkspaceDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _workspaceService.UpdateAsync(id, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Workspace {id} not found." });
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _workspaceService.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound(new { message = $"Workspace {id} not found." });
        return NoContent();
    }
}
