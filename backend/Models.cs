public class Transaction
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public bool IsIncome { get; set; }
    public string Category { get; set; } = "";
    public string Description { get; set; } = "";
    public string Person { get; set; } = "shared"; // person1 | person2 | shared
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SavingsAccount
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Bank { get; set; } = "";
    public decimal InterestRate { get; set; } = 0;
    public string Color { get; set; } = "#6366f1";
    public List<SavingsEntry> Entries { get; set; } = [];
}

public class SavingsEntry
{
    public int Id { get; set; }
    public int SavingsAccountId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; } // positive = in (deposit/interest), negative = withdrawal
    public string Type { get; set; } = "deposit"; // deposit | withdrawal | interest
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ShoppingItem
{
    public int Id { get; set; }
    public DateOnly WeekStart { get; set; } // Monday of the week
    public int DayOfWeek { get; set; }      // 1=Пн 2=Вт 3=Ср 4=Чт 5=Пт
    public string Name { get; set; } = "";
    public decimal EstimatedCost { get; set; }
    public bool IsBought { get; set; }
    public decimal? ActualCost { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CategoryBudget
{
    public int Id { get; set; }
    public string Month { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal Amount { get; set; }
}

public class AppSettings
{
    public int Id { get; set; }
    public string Person1Name { get; set; } = "Настя";
    public string Person2Name { get; set; } = "Партнёр";
    public decimal Person1Salary { get; set; } = 75000;
    public decimal Person2Salary { get; set; } = 75000;
    public decimal CompensationPerPerson { get; set; } = 1050;
    public decimal RentAmount { get; set; } = 38000;
    public decimal UtilitiesBudget { get; set; } = 4000;
}
