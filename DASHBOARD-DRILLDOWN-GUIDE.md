# FinTrack Dashboard Drill-Down Architecture

## Overview
Each dashboard in FinTrack should support clicking on cards to drill down into detailed views with filtering, sorting, and analysis.

---

## 1. DASHBOARD (Home Page)

### Current Cards
- **Total Expenses (This Month)** - Red card
- **Money To Collect** - Yellow card
- **Credit Card Outstanding** - Purple card
- **Monthly Commitments** - Blue card
- **CC Cycle Charges** - Yellow card
- **Investments** - Cyan card
- **Net Position** - Neutral card

### Drill-Down Functionality

#### 1.1 Total Expenses Card → Expenses Dashboard
**Clicking should:**
```javascript
// Navigate to Expenses page with current month pre-filtered
dTotalExpenses.onclick = () => {
  navItems.forEach(n=>n.classList.remove('active'));
  navItems[1].classList.add('active'); // Expenses nav item
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  $('page-expenses').classList.add('active');
  
  // Pre-filter to current month
  const currentMonth = currentMonthKey(); // e.g., "2025-01"
  $('expFilterMonth').value = currentMonth;
  renderExpenses(); // This will apply the filter
};
```

**Shows:**
- Category breakdown (pie chart)
- Payment method breakdown
- Top 5 expense categories
- Daily average
- Largest transactions

---

#### 1.2 Money To Collect Card → Lend Dashboard (with Priority View)
**Enhancement needed:**
```javascript
dMoneyToCollect.onclick = () => {
  // Navigate to Lend page filtered by Pending/Partially Received
  navigateToPage('lend');
  
  // Show only pending entries
  filterLendByStatus(['Pending', 'Partially Received']);
  renderLend();
};

function filterLendByStatus(statuses) {
  const filtered = DATA.lends.filter(l => statuses.includes(l.status));
  
  // Sort by due date (earliest first)
  filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  return filtered;
}
```

**Shows:**
- Who owes you money (sorted by due date)
- Overdue loans (highlighted in red)
- Partial receipts
- Days pending calculation
- Total overdue amount

---

#### 1.3 Credit Card Outstanding → Credit Cards Dashboard
**Enhancement:**
```javascript
dCardOutstanding.onclick = () => {
  navigateToPage('cards');
  
  // Show outstanding summary by card
  renderCardSummary();
  
  // Highlight cards with highest outstanding
  highlightHighestOutstanding();
};

function renderCardSummary() {
  const cardSummary = {};
  
  DATA.cards.forEach(card => {
    if (!cardSummary[card.name]) {
      cardSummary[card.name] = { 
        total: 0, 
        count: 0,
        oldestTxn: null 
      };
    }
    cardSummary[card.name].total += card.amount;
    cardSummary[card.name].count++;
    
    // Track oldest transaction
    if (!cardSummary[card.name].oldestTxn || card.txnDate < cardSummary[card.name].oldestTxn) {
      cardSummary[card.name].oldestTxn = card.txnDate;
    }
  });
  
  // Display as sortable list
  return cardSummary;
}
```

**Shows:**
- Outstanding by card (with bar chart)
- Days since oldest transaction
- Average transaction amount per card
- Utilization rate (if card limit known)
- Due dates

---

#### 1.4 Monthly Commitments Card → Commitments Dashboard
**Enhancement:**
```javascript
dCommitments.onclick = () => {
  navigateToPage('commitments');
  
  // Split by paid/unpaid
  const unpaid = DATA.commitments.filter(c => c.status === 'Unpaid');
  const paid = DATA.commitments.filter(c => c.status === 'Paid');
  
  // Show upcoming vs past due
  showCommitmentsByStatus(unpaid, paid);
};

function showCommitmentsByStatus(unpaid, paid) {
  const today = new Date();
  
  return {
    upcoming: unpaid.filter(c => new Date(c.dueDate) > today),
    overdue: unpaid.filter(c => new Date(c.dueDate) <= today),
    paid: paid
  };
}
```

**Shows:**
- Upcoming commitments (sorted by due date)
- Overdue commitments (red highlight)
- Paid this month
- Monthly recurring expense forecast
- Timeline visualization

---

#### 1.5 CC Cycle Charges → Cycle Analysis Dashboard
**Enhancement:**
```javascript
dCycleCharges.onclick = () => {
  navigateToPage('cccycle');
  
  // Show cost per card per cycle
  analyzeCycleEfficiency();
};

function analyzeCycleEfficiency() {
  const cycles = DATA.cycles;
  const thisMonth = currentMonthKey();
  
  const efficiency = {};
  cycles.forEach(c => {
    if (monthKey(c.date) === thisMonth) {
      if (!efficiency[c.cardName]) {
        efficiency[c.cardName] = { 
          cycles: 0, 
          totalCharges: 0, 
          avgChargePerCycle: 0 
        };
      }
      efficiency[c.cardName].cycles++;
      efficiency[c.cardName].totalCharges += c.charges;
      efficiency[c.cardName].avgChargePerCycle = 
        efficiency[c.cardName].totalCharges / efficiency[c.cardName].cycles;
    }
  });
  
  return efficiency;
}
```

**Shows:**
- Charges per card this month
- Average charge per cycle
- Total money cycled
- Efficiency percentage (charges vs amount cycled)
- Historical trend (last 6 months)

---

#### 1.6 Investments Card → Investments Dashboard
**Enhancement:**
```javascript
dInvestments.onclick = () => {
  navigateToPage('investments');
  
  // Show allocation breakdown
  renderInvestmentAllocation();
};

function renderInvestmentAllocation() {
  const allocationByType = {};
  
  DATA.investments.forEach(inv => {
    // Extract investment type from name (e.g., "Mutual Fund", "Stock", "FD")
    const type = extractInvestmentType(inv.name);
    
    if (!allocationByType[type]) {
      allocationByType[type] = 0;
    }
    allocationByType[type] += inv.amount;
  });
  
  // Calculate percentages
  const total = Object.values(allocationByType).reduce((a, b) => a + b, 0);
  return Object.entries(allocationByType).map(([type, amount]) => ({
    type,
    amount,
    percentage: (amount / total * 100).toFixed(1)
  }));
}
```

**Shows:**
- Investment allocation pie chart
- Investments by type/category
- Recent investments (last 30 days)
- Total invested vs target
- Performance metrics (if applicable)

---

#### 1.7 Net Position Card → Financial Health Dashboard
**Enhancement:**
```javascript
dNetPosition.onclick = () => {
  // Show comprehensive financial position
  renderNetPositionDetail();
};

function renderNetPositionDetail() {
  const totalCollect = DATA.lends
    .filter(l => l.status !== 'Received')
    .reduce((sum, l) => sum + l.amount, 0);
  
  const totalInvest = DATA.investments.reduce((sum, i) => sum + i.amount, 0);
  
  const totalCC = DATA.cards.reduce((sum, c) => sum + c.amount, 0);
  
  const totalCommit = DATA.commitments.reduce((sum, c) => sum + c.amount, 0);
  
  const totalCycleCharges = DATA.cycles.reduce((sum, c) => sum + c.charges, 0);
  
  return {
    assets: totalCollect + totalInvest,
    liabilities: totalCC + totalCommit + totalCycleCharges,
    netPosition: totalCollect + totalInvest - totalCC - totalCommit - totalCycleCharges,
    breakdown: {
      moneyToCollect: totalCollect,
      investments: totalInvest,
      cardOutstanding: totalCC,
      commitments: totalCommit,
      cycleCharges: totalCycleCharges
    }
  };
}
```

**Shows:**
- Net position waterfall chart
- Assets vs Liabilities breakdown
- Trend over last 3 months
- Financial health indicator (Green/Yellow/Red)
- Action items to improve position

---

## 2. EXPENSES PAGE Drill-Down

### Filters Available
- By Category (Food, Travel, etc.)
- By Payment Method (Cash, UPI, CC)
- By Date Range (Month picker)

### Enhanced Drill-Down Features
```javascript
function renderExpensesEnhanced() {
  const filtered = filterExpenses();
  
  // Create clickable category rows
  filtered.forEach(exp => {
    const row = createExpenseRow(exp);
    
    // Add click handler to show expense details
    row.onclick = () => showExpenseDetail(exp);
    
    $('expTableBody').appendChild(row);
  });
}

function showExpenseDetail(expense) {
  // Show modal with:
  // - Full details
  // - Similar expenses (same category)
  // - Frequency of this type of expense
  // - Option to edit/delete
}
```

---

## 3. MONEY TO COLLECT Page Drill-Down

### Enhanced View
```javascript
function renderLendEnhanced() {
  const grouped = groupByPerson();
  
  grouped.forEach(person => {
    // Create person summary card
    const personCard = createPersonSummary(person);
    
    // Click shows all transactions with this person
    personCard.onclick = () => showPersonDetail(person.name);
  });
}

function groupByPerson() {
  const grouped = {};
  
  DATA.lends.forEach(lend => {
    if (!grouped[lend.name]) {
      grouped[lend.name] = [];
    }
    grouped[lend.name].push(lend);
  });
  
  // Convert to array and calculate totals
  return Object.entries(grouped).map(([name, transactions]) => ({
    name,
    total: transactions.reduce((sum, t) => sum + t.amount, 0),
    count: transactions.length,
    pending: transactions.filter(t => t.status === 'Pending').length,
    lastTransaction: Math.max(...transactions.map(t => new Date(t.dateGiven)))
  }));
}
```

---

## 4. CREDIT CARDS Page Drill-Down

### By Card Drill-Down
```javascript
function renderCardsDrilldown() {
  const byCard = groupCardsByName();
  
  byCard.forEach(cardGroup => {
    // Create summary card for each credit card
    const summaryCard = createCardSummary(cardGroup);
    
    // Click shows all transactions for that card
    summaryCard.onclick = () => showCardTransactions(cardGroup.name);
  });
}

function showCardTransactions(cardName) {
  const transactions = DATA.cards.filter(c => c.name === cardName);
  
  // Show:
  // - All transactions (newest first)
  // - Total outstanding
  // - Oldest pending transaction
  // - Due date
  // - Payment history
}
```

---

## 5. REPORTS PAGE Drill-Down

### Multi-Level Analysis
```javascript
function renderReportsEnhanced() {
  // Level 1: Summary cards
  renderReportSummary();
  
  // Level 2: Category breakdown (clickable)
  renderCategoryBreakdown();
  
  // Level 3: Transaction table (expandable rows)
  renderTransactionTable();
}

// Click category to see all transactions in that category
function showCategoryDetail(category) {
  const categoryExpenses = DATA.expenses.filter(e => e.category === category);
  
  // Show:
  // - Daily breakdown
  // - Average per transaction
  // - Trend (up/down vs previous month)
  // - Top merchants/locations
}
```

---

## Implementation Checklist

### Phase 1: Core Drill-Down (MVP)
- [ ] Card click → Navigate to relevant page with pre-filter
- [ ] Add clickable class and cursor pointer to cards
- [ ] Preserve filter state when returning to dashboard
- [ ] Add breadcrumb navigation

### Phase 2: Enhanced Analytics
- [ ] Category breakdown in Reports
- [ ] Person-based grouping in Money To Collect
- [ ] Card-based grouping in Credit Cards
- [ ] Financial health indicators

### Phase 3: Visual Enhancements
- [ ] Modal details for individual transactions
- [ ] Drill-down counters (e.g., "5 Pending" on Money To Collect card)
- [ ] Animated transitions
- [ ] Comparison views (this month vs last month)

### Phase 4: Advanced Features
- [ ] Predictive alerts (high spending categories)
- [ ] Forecast spending based on trends
- [ ] Budget recommendations
- [ ] Anomaly detection

---

## Code Template: Generic Drill-Down Handler

```javascript
class DashboardDrilldown {
  constructor() {
    this.currentFilter = {};
    this.navigationStack = [];
  }
  
  drillDown(source, filterObj) {
    // Add to navigation stack
    this.navigationStack.push(this.currentFilter);
    
    // Apply filter
    this.currentFilter = filterObj;
    
    // Navigate and render
    this.navigateAndRender(source);
  }
  
  navigateAndRender(source) {
    // Show appropriate page
    const pageMap = {
      'dTotalExpenses': 'expenses',
      'dMoneyToCollect': 'lend',
      'dCardOutstanding': 'cards',
      'dCommitments': 'commitments',
      'dCycleCharges': 'cccycle',
      'dInvestments': 'investments',
      'dNetPosition': 'dashboard' // Stay on dashboard
    };
    
    const targetPage = pageMap[source];
    navigateToPage(targetPage);
  }
  
  goBack() {
    if (this.navigationStack.length > 0) {
      this.currentFilter = this.navigationStack.pop();
      // Re-render with previous filter
    }
  }
}
```

---

## Performance Optimization

### Debounce Filter Changes
```javascript
const debouncedRender = debounce(() => renderExpenses(), 300);

$('expFilterCategory').addEventListener('change', debouncedRender);
$('expFilterMonth').addEventListener('change', debouncedRender);

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### Memoize Calculations
```javascript
const memoizedCategoryBreakdown = memoize((expenses) => {
  return groupExpensesByCategory(expenses);
});

function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

---

## Summary

Each dashboard card should:
1. Be **clickable** (add cursor: pointer)
2. **Navigate** to the relevant detailed page
3. **Pre-apply filters** based on the card context
4. Support **drill-down filtering** (by category, date, etc.)
5. Show **related insights** (trends, comparisons)
6. Allow **quick actions** (edit, delete from detail view)
7. Support **navigation back** to dashboard
