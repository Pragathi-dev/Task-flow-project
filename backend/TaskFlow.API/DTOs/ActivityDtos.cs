using System;
using System.Text.Json.Nodes;

namespace TaskFlow.API.DTOs;

public class ActivityDto
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string EntityTitle { get; set; } = string.Empty;
    public Guid WorkspaceId { get; set; }
    public Guid? BoardId { get; set; }
    public Guid? ColumnId { get; set; }
    public JsonNode? Meta { get; set; }
    public DateTime Timestamp { get; set; }
}

public class CreateActivityDto
{
    public string EventType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string EntityTitle { get; set; } = string.Empty;
    public Guid WorkspaceId { get; set; }
    public Guid? BoardId { get; set; }
    public Guid? ColumnId { get; set; }
    public JsonNode? Meta { get; set; }
}
