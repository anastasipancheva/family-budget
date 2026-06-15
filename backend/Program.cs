using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var rawUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? throw new Exception("DATABASE_URL environment variable is not set");

// Convert postgresql:// URI to Npgsql key=value connection string
string connStr;
if (rawUrl.Contains("://"))
{
    // Normalize scheme so Uri can parse it
    var normalized = System.Text.RegularExpressions.Regex.Replace(rawUrl, @"^[a-z]+://", "http://");
    var uri = new Uri(normalized);
    var userParts = uri.UserInfo.Split(':', 2);
    var user = Uri.UnescapeDataString(userParts[0]);
    var pass = Uri.UnescapeDataString(userParts.Length > 1 ? userParts[1] : "");
    var db   = uri.AbsolutePath.TrimStart('/').Split('?')[0];
    var port = uri.Port > 0 ? uri.Port : 5432;
    connStr = $"Host={uri.Host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true";
}
else
{
    connStr = rawUrl;
}

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(connStr));

builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

// ── Transactions ──────────────────────────────────────────────────────────────

app.MapGet("/api/transactions", async (AppDbContext db, string? month, bool? isIncome, string? category, string? person, string? search) =>
{
    var q = db.Transactions.AsQueryable();

    if (month is not null && DateOnly.TryParseExact(month, "yyyy-MM", out var d))
        q = q.Where(t => t.Date.Year == d.Year && t.Date.Month == d.Month);
    if (isIncome.HasValue)
        q = q.Where(t => t.IsIncome == isIncome.Value);
    if (!string.IsNullOrEmpty(category))
        q = q.Where(t => t.Category == category);
    if (!string.IsNullOrEmpty(person))
        q = q.Where(t => t.Person == person);
    if (!string.IsNullOrEmpty(search))
        q = q.Where(t => t.Description.Contains(search) || t.Category.Contains(search));

    return await q.OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAt).ToListAsync();
});

app.MapPost("/api/transactions", async (AppDbContext db, Transaction t) =>
{
    t.Id = 0;
    t.CreatedAt = DateTime.UtcNow;
    db.Transactions.Add(t);
    await db.SaveChangesAsync();
    return Results.Created($"/api/transactions/{t.Id}", t);
});

app.MapDelete("/api/transactions/{id:int}", async (AppDbContext db, int id) =>
{
    var t = await db.Transactions.FindAsync(id);
    if (t is null) return Results.NotFound();
    db.Transactions.Remove(t);
    await db.SaveChangesAsync();
    return Results.Ok();
});

// ── Stats ─────────────────────────────────────────────────────────────────────

app.MapGet("/api/stats", async (AppDbContext db, string? month) =>
{
    DateOnly d;
    if (month is null || !DateOnly.TryParseExact(month, "yyyy-MM", out d))
        d = DateOnly.FromDateTime(DateTime.Today);

    var list = await db.Transactions
        .Where(t => t.Date.Year == d.Year && t.Date.Month == d.Month)
        .ToListAsync();

    var totalIncome = list.Where(t => t.IsIncome).Sum(t => t.Amount);
    var totalExpense = list.Where(t => !t.IsIncome).Sum(t => t.Amount);

    var byCategory = list
        .GroupBy(t => new { t.Category, t.IsIncome })
        .Select(g => new
        {
            category = g.Key.Category,
            isIncome = g.Key.IsIncome,
            amount = g.Sum(t => t.Amount),
        })
        .OrderByDescending(x => x.amount)
        .ToList();

    return new { totalIncome, totalExpense, balance = totalIncome - totalExpense, byCategory };
});

// ── Settings ──────────────────────────────────────────────────────────────────

app.MapGet("/api/settings", async (AppDbContext db) =>
    await db.Settings.FirstAsync());

app.MapPut("/api/settings", async (AppDbContext db, AppSettings incoming) =>
{
    var s = await db.Settings.FirstAsync();
    s.Person1Name = incoming.Person1Name;
    s.Person2Name = incoming.Person2Name;
    s.Person1Salary = incoming.Person1Salary;
    s.Person2Salary = incoming.Person2Salary;
    s.CompensationPerPerson = incoming.CompensationPerPerson;
    s.RentAmount = incoming.RentAmount;
    s.UtilitiesBudget = incoming.UtilitiesBudget;
    await db.SaveChangesAsync();
    return Results.Ok(s);
});

// ── Quick-add compensation ────────────────────────────────────────────────────

app.MapPost("/api/compensation/add", async (AppDbContext db, CompensationRequest req) =>
{
    var settings = await db.Settings.FirstAsync();
    var t = new Transaction
    {
        Date = req.Date,
        Amount = settings.CompensationPerPerson * 2,
        IsIncome = true,
        Category = "Компенсация",
        Description = $"Компенсация за {req.Date:dd.MM}",
        Person = "shared",
        CreatedAt = DateTime.UtcNow,
    };
    db.Transactions.Add(t);
    await db.SaveChangesAsync();
    return Results.Created($"/api/transactions/{t.Id}", t);
});

// ── Savings Accounts ──────────────────────────────────────────────────────────

app.MapGet("/api/savings", async (AppDbContext db) =>
{
    var accounts = await db.SavingsAccounts.Include(a => a.Entries).ToListAsync();
    return accounts.Select(a => new
    {
        a.Id, a.Name, a.Bank, a.InterestRate, a.Color,
        balance = a.Entries.Sum(e => e.Amount),
        entries = a.Entries.OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt).ToList(),
    });
});

app.MapPost("/api/savings", async (AppDbContext db, SavingsAccount account) =>
{
    account.Id = 0;
    db.SavingsAccounts.Add(account);
    await db.SaveChangesAsync();
    return Results.Created($"/api/savings/{account.Id}", account);
});

app.MapPut("/api/savings/{id:int}", async (AppDbContext db, int id, SavingsAccount incoming) =>
{
    var a = await db.SavingsAccounts.FindAsync(id);
    if (a is null) return Results.NotFound();
    a.Name = incoming.Name;
    a.Bank = incoming.Bank;
    a.InterestRate = incoming.InterestRate;
    a.Color = incoming.Color;
    await db.SaveChangesAsync();
    return Results.Ok(a);
});

app.MapDelete("/api/savings/{id:int}", async (AppDbContext db, int id) =>
{
    var a = await db.SavingsAccounts.FindAsync(id);
    if (a is null) return Results.NotFound();
    db.SavingsAccounts.Remove(a);
    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapPost("/api/savings/{id:int}/entries", async (AppDbContext db, int id, SavingsEntry entry) =>
{
    var account = await db.SavingsAccounts.FindAsync(id);
    if (account is null) return Results.NotFound();

    entry.Id = 0;
    entry.SavingsAccountId = id;
    entry.CreatedAt = DateTime.UtcNow;
    db.SavingsEntries.Add(entry);

    // Interest entries also appear as income in the main ledger
    if (entry.Type == "interest" && entry.Amount > 0)
    {
        db.Transactions.Add(new Transaction
        {
            Date = entry.Date,
            Amount = entry.Amount,
            IsIncome = true,
            Category = "Проценты по вкладу",
            Description = $"Проценты: {account.Name}",
            Person = "shared",
            CreatedAt = DateTime.UtcNow,
        });
    }

    await db.SaveChangesAsync();
    return Results.Created($"/api/savings/{id}/entries/{entry.Id}", entry);
});

app.MapDelete("/api/savings/entries/{entryId:int}", async (AppDbContext db, int entryId) =>
{
    var e = await db.SavingsEntries.FindAsync(entryId);
    if (e is null) return Results.NotFound();
    db.SavingsEntries.Remove(e);
    await db.SaveChangesAsync();
    return Results.Ok();
});

// ── Budget ────────────────────────────────────────────────────────────────────

app.MapGet("/api/budget", async (AppDbContext db, string month) =>
    await db.CategoryBudgets.Where(b => b.Month == month).ToListAsync());

app.MapPut("/api/budget", async (AppDbContext db, BudgetUpsertRequest req) =>
{
    var existing = await db.CategoryBudgets
        .FirstOrDefaultAsync(b => b.Month == req.Month && b.Category == req.Category);

    if (existing is null)
        db.CategoryBudgets.Add(new CategoryBudget { Month = req.Month, Category = req.Category, Amount = req.Amount });
    else
        existing.Amount = req.Amount;

    await db.SaveChangesAsync();
    return Results.Ok();
});

// ── Shopping plan ─────────────────────────────────────────────────────────────

app.MapGet("/api/grocery", async (AppDbContext db, string weekStart) =>
{
    if (!DateOnly.TryParseExact(weekStart, "yyyy-MM-dd", out var ws)) return Results.BadRequest();
    return Results.Ok(await db.ShoppingItems
        .Where(i => i.WeekStart == ws)
        .OrderBy(i => i.DayOfWeek).ThenBy(i => i.CreatedAt)
        .ToListAsync());
});

app.MapPost("/api/grocery", async (AppDbContext db, ShoppingItem item) =>
{
    item.Id = 0;
    item.CreatedAt = DateTime.UtcNow;
    db.ShoppingItems.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/grocery/{item.Id}", item);
});

app.MapPut("/api/grocery/{id:int}", async (AppDbContext db, int id, ShoppingItemUpdate update) =>
{
    var item = await db.ShoppingItems.FindAsync(id);
    if (item is null) return Results.NotFound();
    item.IsBought = update.IsBought;
    if (update.ActualCost.HasValue) item.ActualCost = update.ActualCost;
    if (update.Name is not null) item.Name = update.Name;
    if (update.EstimatedCost.HasValue) item.EstimatedCost = update.EstimatedCost.Value;
    await db.SaveChangesAsync();
    return Results.Ok(item);
});

app.MapDelete("/api/grocery/{id:int}", async (AppDbContext db, int id) =>
{
    var item = await db.ShoppingItems.FindAsync(id);
    if (item is null) return Results.NotFound();
    db.ShoppingItems.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok();
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");

record CompensationRequest(DateOnly Date);
record BudgetUpsertRequest(string Month, string Category, decimal Amount);
record ShoppingItemUpdate(bool IsBought, decimal? ActualCost, string? Name, decimal? EstimatedCost);
