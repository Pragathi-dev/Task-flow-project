using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TaskFlow.API.DTOs;

public class ColumnDto
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<Guid> TaskIds { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateColumnDto
{
    [Required(ErrorMessage = "Column name is required.")]
    [MaxLength(100, ErrorMessage = "Column name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Board ID is required.")]
    public Guid BoardId { get; set; }

    public int Order { get; set; } = 0;
}

public class UpdateColumnDto
{
    [MaxLength(100, ErrorMessage = "Column name cannot exceed 100 characters.")]
    public string? Name { get; set; }

    public int? Order { get; set; }
}

public class ReorderColumnsDto
{
    [Required]
    public List<Guid> ColumnIds { get; set; } = new();
}
