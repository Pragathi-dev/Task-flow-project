using System;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Entities;

namespace TaskFlow.API.Data;

public class TaskFlowDbContext : DbContext
{
    public static readonly Guid DefaultUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public TaskFlowDbContext(DbContextOptions<TaskFlowDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<ColumnEntity> Columns => Set<ColumnEntity>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Activity> Activities => Set<Activity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed Default Demo User for pre-auth testing
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = DefaultUserId,
            Email = "demo@taskflow.dev",
            FullName = "Demo User",
            PasswordHash = "AQAAAAEAACcQAAAAE",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        // User
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Workspace
        modelBuilder.Entity<Workspace>()
            .HasOne(w => w.User)
            .WithMany(u => u.Workspaces)
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Board
        modelBuilder.Entity<Board>()
            .HasOne(b => b.Workspace)
            .WithMany(w => w.Boards)
            .HasForeignKey(b => b.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Board>()
            .HasOne(b => b.User)
            .WithMany(u => u.Boards)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Column
        modelBuilder.Entity<ColumnEntity>()
            .HasOne(c => c.Board)
            .WithMany(b => b.Columns)
            .HasForeignKey(c => c.BoardId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ColumnEntity>()
            .HasOne(c => c.User)
            .WithMany(u => u.Columns)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // TaskItem
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Column)
            .WithMany(c => c.Tasks)
            .HasForeignKey(t => t.ColumnId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Board)
            .WithMany(b => b.Tasks)
            .HasForeignKey(t => t.BoardId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Workspace)
            .WithMany(w => w.Tasks)
            .HasForeignKey(t => t.WorkspaceId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.User)
            .WithMany(u => u.Tasks)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ChecklistItem
        modelBuilder.Entity<ChecklistItem>()
            .HasOne(ci => ci.Task)
            .WithMany(t => t.ChecklistItems)
            .HasForeignKey(ci => ci.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        // Comment
        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Task)
            .WithMany(t => t.Comments)
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Activity
        modelBuilder.Entity<Activity>()
            .HasOne(a => a.Workspace)
            .WithMany(w => w.Activities)
            .HasForeignKey(a => a.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Activity>()
            .HasOne(a => a.User)
            .WithMany(u => u.Activities)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for performance
        modelBuilder.Entity<Workspace>().HasIndex(w => w.UserId);
        modelBuilder.Entity<Board>().HasIndex(b => new { b.WorkspaceId, b.UserId });
        modelBuilder.Entity<ColumnEntity>().HasIndex(c => new { c.BoardId, c.Order });
        modelBuilder.Entity<TaskItem>().HasIndex(t => new { t.ColumnId, t.Order });
        modelBuilder.Entity<TaskItem>().HasIndex(t => t.BoardId);
        modelBuilder.Entity<TaskItem>().HasIndex(t => t.WorkspaceId);
        modelBuilder.Entity<TaskItem>().HasIndex(t => t.UserId);
        modelBuilder.Entity<Activity>().HasIndex(a => new { a.WorkspaceId, a.Timestamp });
    }
}
