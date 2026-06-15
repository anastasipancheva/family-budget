using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<SavingsAccount> SavingsAccounts => Set<SavingsAccount>();
    public DbSet<SavingsEntry> SavingsEntries => Set<SavingsEntry>();
    public DbSet<CategoryBudget> CategoryBudgets => Set<CategoryBudget>();
    public DbSet<ShoppingItem> ShoppingItems => Set<ShoppingItem>();
    public DbSet<AppSettings> Settings => Set<AppSettings>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<AppSettings>().HasData(new AppSettings { Id = 1 });
        b.Entity<SavingsAccount>()
            .HasMany(a => a.Entries)
            .WithOne()
            .HasForeignKey(e => e.SavingsAccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
