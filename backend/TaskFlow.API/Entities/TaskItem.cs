using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskFlow.API.Entities;

[Table("Tasks")]
public class TaskItem
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ColumnId { get; set; }

    [Required]
    public Guid BoardId { get; set; }

    [Required]
    public Guid WorkspaceId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [MaxLength(20)]
    public string Priority { get; set; } = "medium";

    public string LabelsJson { get; set; } = "[]";

    public DateTime? DueDate { get; set; }

    public double EstimatedHours { get; set; } = 0;

    public int Order { get; set; } = 0;

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ColumnEntity? Column { get; set; }
    public Board? Board { get; set; }
    public Workspace? Workspace { get; set; }
    public User? User { get; set; }
    public ICollection<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
