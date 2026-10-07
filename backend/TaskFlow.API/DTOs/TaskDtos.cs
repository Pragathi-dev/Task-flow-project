using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TaskFlow.API.DTOs;

public class ChecklistItemDto
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateChecklistItemDto
{
    [Required(ErrorMessage = "Checklist text is required.")]
    [MaxLength(300, ErrorMessage = "Checklist text cannot exceed 300 characters.")]
    public string Text { get; set; } = string.Empty;

    public int Order { get; set; } = 0;
}

public class UpdateChecklistItemDto
{
    [MaxLength(300, ErrorMessage = "Checklist text cannot exceed 300 characters.")]
    public string? Text { get; set; }

    public bool? Completed { get; set; }

    public int? Order { get; set; }
}

public class CommentDto
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateCommentDto
{
    [Required(ErrorMessage = "Comment text is required.")]
    public string Text { get; set; } = string.Empty;
}

public class TaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "medium";
    public List<string> Labels { get; set; } = new();
    public DateTime? DueDate { get; set; }
    public double EstimatedHours { get; set; }
    public int Order { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid ColumnId { get; set; }
    public Guid BoardId { get; set; }
    public Guid WorkspaceId { get; set; }
    public List<ChecklistItemDto> Checklist { get; set; } = new();
    public List<CommentDto> Comments { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTaskDto
{
    [Required(ErrorMessage = "Task title is required.")]
    [MaxLength(200, ErrorMessage = "Task title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Column ID is required.")]
    public Guid ColumnId { get; set; }

    [Required(ErrorMessage = "Board ID is required.")]
    public Guid BoardId { get; set; }

    [Required(ErrorMessage = "Workspace ID is required.")]
    public Guid WorkspaceId { get; set; }

    public string? Description { get; set; }

    [MaxLength(20)]
    public string Priority { get; set; } = "medium";

    public List<string> Labels { get; set; } = new();

    public DateTime? DueDate { get; set; }

    public double EstimatedHours { get; set; } = 0;
}

public class UpdateTaskDto
{
    [MaxLength(200, ErrorMessage = "Task title cannot exceed 200 characters.")]
    public string? Title { get; set; }

    public string? Description { get; set; }

    [MaxLength(20)]
    public string? Priority { get; set; }

    public List<string>? Labels { get; set; }

    public DateTime? DueDate { get; set; }

    public double? EstimatedHours { get; set; }
}

public class MoveTaskDto
{
    [Required(ErrorMessage = "Source column ID is required.")]
    public Guid SourceColumnId { get; set; }

    [Required(ErrorMessage = "Destination column ID is required.")]
    public Guid DestinationColumnId { get; set; }

    public int NewOrder { get; set; } = 0;
}
