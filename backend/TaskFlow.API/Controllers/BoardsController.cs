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
[Route("api")]
public class BoardsController : ControllerBase
{
    private readonly IBoardService _boardService;

    public BoardsController(IBoardService boardService)
    {
        _boardService = boardService;
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

    [HttpGet("workspaces/{workspaceId:guid}/boards")]
    [ProducesResponseType(typeof(IEnumerable<BoardDto>), 200)]
    public async Task<ActionResult<IEnumerable<BoardDto>>> GetByWorkspace(Guid workspaceId)
    {
        var result = await _boardService.GetByWorkspaceIdAsync(workspaceId, CurrentUserId);
        return Ok(result);
    }

    [HttpGet("boards/{id:guid}")]
    [ProducesResponseType(typeof(BoardDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<BoardDto>> GetById(Guid id)
    {
        var result = await _boardService.GetByIdAsync(id, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Board {id} not found." });
        return Ok(result);
    }

    [HttpPost("workspaces/{workspaceId:guid}/boards")]
    [ProducesResponseType(typeof(BoardDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<BoardDto>> Create(Guid workspaceId, [FromBody] CreateBoardDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        dto.WorkspaceId = workspaceId;

        try
        {
            var result = await _boardService.CreateAsync(dto, CurrentUserId);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("boards/{id:guid}")]
    [ProducesResponseType(typeof(BoardDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<BoardDto>> Update(Guid id, [FromBody] UpdateBoardDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _boardService.UpdateAsync(id, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Board {id} not found." });
        return Ok(result);
    }

    [HttpDelete("boards/{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _boardService.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound(new { message = $"Board {id} not found." });
        return NoContent();
    }
}
