using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskFlow.API.Entities;

[Table("Activities")]
public class Activity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid WorkspaceId { get; set; }

    public Guid? BoardId { get; set; }

    public Guid? ColumnId { get; set; }

    [Required]
    public Guid EntityId { get; set; }

    [Required]
    [MaxLength(50)]
    public string EventType { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EntityTitle { get; set; } = string.Empty;

    public string? MetaJson { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
    public Workspace? Workspace { get; set; }
    public Board? Board { get; set; }
}
