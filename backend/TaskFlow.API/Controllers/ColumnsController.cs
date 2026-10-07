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
public class ColumnsController : ControllerBase
{
    private readonly IColumnService _columnService;

    public ColumnsController(IColumnService columnService)
    {
        _columnService = columnService;
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

    [HttpGet("boards/{boardId:guid}/columns")]
    [ProducesResponseType(typeof(IEnumerable<ColumnDto>), 200)]
    public async Task<ActionResult<IEnumerable<ColumnDto>>> GetByBoard(Guid boardId)
    {
        var result = await _columnService.GetByBoardIdAsync(boardId, CurrentUserId);
        return Ok(result);
    }

    [HttpPost("boards/{boardId:guid}/columns")]
    [ProducesResponseType(typeof(ColumnDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ColumnDto>> Create(Guid boardId, [FromBody] CreateColumnDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        dto.BoardId = boardId;

        try
        {
            var result = await _columnService.CreateAsync(dto, CurrentUserId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("columns/{id:guid}")]
    [ProducesResponseType(typeof(ColumnDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ColumnDto>> Update(Guid id, [FromBody] UpdateColumnDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _columnService.UpdateAsync(id, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Column {id} not found." });
        return Ok(result);
    }

    [HttpDelete("columns/{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _columnService.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound(new { message = $"Column {id} not found." });
        return NoContent();
    }

    [HttpPut("boards/{boardId:guid}/columns/reorder")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Reorder(Guid boardId, [FromBody] ReorderColumnsDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var success = await _columnService.ReorderAsync(boardId, dto.ColumnIds, CurrentUserId);
        if (!success) return BadRequest(new { message = "Failed to reorder columns." });
        return NoContent();
    }
}
