using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TaskFlow.API.DTOs;

public class BoardDto
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public List<Guid> ColumnIds { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateBoardDto
{
    [Required(ErrorMessage = "Board name is required.")]
    [MaxLength(100, ErrorMessage = "Board name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Workspace ID is required.")]
    public Guid WorkspaceId { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? Icon { get; set; }
}

public class UpdateBoardDto
{
    [MaxLength(100, ErrorMessage = "Board name cannot exceed 100 characters.")]
    public string? Name { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? Icon { get; set; }
}
