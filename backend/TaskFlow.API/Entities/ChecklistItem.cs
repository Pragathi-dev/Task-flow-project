using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskFlow.API.Entities;

[Table("ChecklistItems")]
public class ChecklistItem
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TaskId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Text { get; set; } = string.Empty;

    public bool Completed { get; set; } = false;

    public int Order { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public TaskItem? Task { get; set; }
}
