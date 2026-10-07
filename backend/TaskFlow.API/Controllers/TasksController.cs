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
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
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

    [HttpGet("boards/{boardId:guid}/tasks")]
    [ProducesResponseType(typeof(IEnumerable<TaskDto>), 200)]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetByBoard(Guid boardId)
    {
        var result = await _taskService.GetByBoardIdAsync(boardId, CurrentUserId);
        return Ok(result);
    }

    [HttpGet("tasks/{id:guid}")]
    [ProducesResponseType(typeof(TaskDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskDto>> GetById(Guid id)
    {
        var result = await _taskService.GetByIdAsync(id, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Task {id} not found." });
        return Ok(result);
    }

    [HttpPost("tasks")]
    [ProducesResponseType(typeof(TaskDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<TaskDto>> Create([FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _taskService.CreateAsync(dto, CurrentUserId);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("tasks/{id:guid}")]
    [ProducesResponseType(typeof(TaskDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskDto>> Update(Guid id, [FromBody] UpdateTaskDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _taskService.UpdateAsync(id, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Task {id} not found." });
        return Ok(result);
    }

    [HttpDelete("tasks/{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _taskService.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound(new { message = $"Task {id} not found." });
        return NoContent();
    }

    [HttpPut("tasks/{id:guid}/move")]
    [ProducesResponseType(typeof(TaskDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskDto>> Move(Guid id, [FromBody] MoveTaskDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _taskService.MoveTaskAsync(id, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Task {id} not found." });
        return Ok(result);
    }

    [HttpPut("tasks/{id:guid}/complete")]
    [ProducesResponseType(typeof(TaskDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskDto>> ToggleComplete(Guid id)
    {
        var result = await _taskService.ToggleCompleteAsync(id, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Task {id} not found." });
        return Ok(result);
    }

    // Checklist Endpoints
    [HttpPost("tasks/{taskId:guid}/checklist")]
    [ProducesResponseType(typeof(ChecklistItemDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ChecklistItemDto>> AddChecklistItem(Guid taskId, [FromBody] CreateChecklistItemDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _taskService.AddChecklistItemAsync(taskId, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Task {taskId} not found." });
        return Ok(result);
    }

    [HttpPut("checklist/{id:guid}")]
    [ProducesResponseType(typeof(ChecklistItemDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ChecklistItemDto>> UpdateChecklistItem(Guid id, [FromBody] UpdateChecklistItemDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _taskService.UpdateChecklistItemAsync(id, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Checklist item {id} not found." });
        return Ok(result);
    }

    [HttpDelete("checklist/{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteChecklistItem(Guid id)
    {
        var deleted = await _taskService.DeleteChecklistItemAsync(id, CurrentUserId);
        if (!deleted) return NotFound(new { message = $"Checklist item {id} not found." });
        return NoContent();
    }

    // Comment Endpoints
    [HttpGet("tasks/{taskId:guid}/comments")]
    [ProducesResponseType(typeof(IEnumerable<CommentDto>), 200)]
    public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(Guid taskId)
    {
        var result = await _taskService.GetCommentsAsync(taskId, CurrentUserId);
        return Ok(result);
    }

    [HttpPost("tasks/{taskId:guid}/comments")]
    [ProducesResponseType(typeof(CommentDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<CommentDto>> AddComment(Guid taskId, [FromBody] CreateCommentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _taskService.AddCommentAsync(taskId, dto, CurrentUserId);
        if (result == null) return NotFound(new { message = $"Task {taskId} not found." });
        return Ok(result);
    }

    [HttpDelete("comments/{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var deleted = await _taskService.DeleteCommentAsync(id, CurrentUserId);
        if (!deleted) return NotFound(new { message = $"Comment {id} not found." });
        return NoContent();
    }
}
