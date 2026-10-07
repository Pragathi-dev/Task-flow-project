using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TaskFlow.API.DTOs;

public class WorkspaceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public List<Guid> BoardIds { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateWorkspaceDto
{
    [Required(ErrorMessage = "Workspace name is required.")]
    [MaxLength(100, ErrorMessage = "Workspace name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Accent color is required.")]
    [MaxLength(20)]
    public string Color { get; set; } = "#3b82f6";

    [MaxLength(50)]
    public string? Icon { get; set; } = "🚀";
}

public class UpdateWorkspaceDto
{
    [MaxLength(100, ErrorMessage = "Workspace name cannot exceed 100 characters.")]
    public string? Name { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? Icon { get; set; }
}
