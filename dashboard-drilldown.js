/* ============================================================
   DASHBOARD DRILL-DOWN MODULE
   Enables clicking on dashboard cards to drill into detailed views
   ============================================================ */

// Navigation and filter state management
const DrilldownState = {
  navigationStack: [],
  currentFilter: {},
  currentPage: 'dashboard',
  
  goToPage(page, filter = {}) {
    this.navigationStack.push({
      page: this.currentPage,
      filter: { ...this.currentFilter }
    });
    this.currentPage = page;
    this.currentFilter = filter;
    navigateToPageWithFilter(page, filter);
  },
  
  goBack() {
    if (this.navigationStack.length > 0) {
      const prev = this.navigationStack.pop();
      this.currentPage = prev.page;
      this.currentFilter = prev.filter;
      navigateToPageWithFilter(prev.page, prev.filter);
    }
  }
};

// Initialize drill-down on dashboard cards
function initDashboardDrilldown() {
  // 1. TOTAL EXPENSES → Expenses Dashboard (filtered to current month)
  $('dTotalExpenses').parentElement.style.cursor = 'pointer';
  $('dTotalExpenses').parentElement.addEventListener('click', () => {
    DrilldownState.goToPage('expenses', { 
      month: currentMonthKey(),
      showAllCategories: true 
    });
  });

  // 2. MONEY TO COLLECT → Lend Dashboard (filtered to pending)
  $('dMoneyToCollect').parentElement.style.cursor = 'pointer';
  $('dMoneyToCollect').parentElement.addEventListener('click', () => {
    DrilldownState.goToPage('lend', { 
      statusFilter: ['Pending', 'Partially Received'],
      sortBy: 'dueDate'
    });
  });

  // 3. CREDIT CARD OUTSTANDING → Cards Dashboard
  $('dCardOutstanding').parentElement.style.cursor = 'pointer';
  $('dCardOutstanding').parentElement.addEventListener('click', () => {
    DrilldownState.goToPage('cards', { 
      showSummary: true
    });
  });

  // 4. MONTHLY COMMITMENTS → Commitments Dashboard
  $('dCommitments').parentElement.style.cursor = 'pointer';
  $('dCommitments').parentElement.addEventListener('click', () => {
    DrilldownState.goToPage('commitments', { 
      statusFilter: 'Unpaid',
      sortBy: 'dueDate'
    });
  });

  // 5. CC CYCLE CHARGES → Cycle Dashboard (current month)
  $('dCycleCharges').parentElement.style.cursor = 'pointer';
  $('dCycleCharges').parentElement.addEventListener('click', () => {
    DrilldownState.goToPage('cccycle', { 
      month: currentMonthKey(),
      showEfficiency: true
    });
  });

  // 6. INVESTMENTS → Investments Dashboard
  $('dInvestments').parentElement.style.cursor = 'pointer';
  $('dInvestments').parentElement.addEventListener('click', () => {
    DrilldownState.goToPage('investments', { 
      showAllocation: true
    });
  });

  // 7. NET POSITION → Dashboard (stay but highlight)
  $('dNetPosition').parentElement.style.cursor = 'pointer';
  $('dNetPosition').parentElement.addEventListener('click', () => {
    // Show net position breakdown modal
    showNetPositionDetail();
  });
}

// ============================================================
// PAGE NAVIGATION WITH FILTERS
// ============================================================

function navigateToPageWithFilter(page, filter = {}) {
  navItems.forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Find and activate nav item
  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // Activate page
  $(`page-${page}`).classList.add('active');
  $('sidebar').classList.remove('open');
  
  // Apply filters based on page
  applyFiltersToPage(page, filter);
  
  // Render
  if (page === 'dashboard') renderDashboard();
  else if (page === 'expenses') renderExpenses();
  else if (page === 'lend') renderLend();
  else if (page === 'cards') renderCards();
  else if (page === 'cccycle') renderCycles();
  else if (page === 'commitments') renderCommitments();
  else if (page === 'investments') renderInvestments();
  else if (page === 'reports') renderReport();
}

function applyFiltersToPage(page, filter) {
  if (page === 'expenses') {
    // Pre-filter expenses to current month or custom month
    if (filter.month) {
      $('expFilterMonth').value = filter.month;
    }
    if (filter.statusFilter) {
      // TODO: Add status filter if needed
    }
  } 
  else if (page === 'lend') {
    // Pre-filter to pending lends
    // Store in global state for rendering
    window.lendStatusFilter = filter.statusFilter || ['Pending', 'Partially Received'];
    window.lendSortBy = filter.sortBy || 'dueDate';
  } 
  else if (page === 'commitments') {
    window.commitStatusFilter = filter.statusFilter || 'Unpaid';
    window.commitSortBy = filter.sortBy || 'dueDate';
  }
  else if (page === 'cccycle') {
    if (filter.month) {
      $('cycleFilter').value = '';
    }
    window.cycleShowEfficiency = filter.showEfficiency;
  }
  else if (page === 'investments') {
    window.investShowAllocation = filter.showAllocation;
  }
}

// ============================================================
// EXPENSE PAGE ENHANCEMENTS
// ============================================================

function enhanceExpenseRendering() {
  // Add click handlers to expense rows to show details
  const rows = document.querySelectorAll('#expTableBody tr');
  rows.forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', (e) => {
      // Get expense data from row
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const expenseDate = cells[0].textContent;
        const expenseAmount = cells[1].textContent;
        const expenseCategory = cells[2].textContent;
        // Show expense detail modal
        showExpenseDetail({ date: expenseDate, amount: expenseAmount, category: expenseCategory });
      }
    });
  });
  
  // Add category breakdown
  renderExpenseCategoryBreakdown();
}

function renderExpenseCategoryBreakdown() {
  const categories = {};
  const filtered = filterExpensesByMonth(DrilldownState.currentFilter.month);
  
  filtered.forEach(exp => {
    if (!categories[exp.category]) {
      categories[exp.category] = { total: 0, count: 0 };
    }
    categories[exp.category].total += exp.amount;
    categories[exp.category].count++;
  });
  
  // Display as summary cards or table
  console.log('Category Breakdown:', categories);
}

function filterExpensesByMonth(monthStr) {
  if (!monthStr) return DATA.expenses;
  return DATA.expenses.filter(e => monthKey(e.date) === monthStr);
}

function showExpenseDetail(expense) {
  // Create and show modal with expense details
  const html = `
    <div class="overlay show" id="expenseDetailModal">
      <div class="confirm-box">
        <h3>Expense Detail</h3>
        <p><strong>Date:</strong> ${expense.date}</p>
        <p><strong>Amount:</strong> ${expense.amount}</p>
        <p><strong>Category:</strong> ${expense.category}</p>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('expenseDetailModal').remove()">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ============================================================
// LEND PAGE ENHANCEMENTS
// ============================================================

function enhanceLendRendering() {
  // Group lends by person
  const grouped = groupLendByPerson();
  
  // Add summary for each person
  renderLendPersonSummary(grouped);
  
  // Filter by status if specified
  if (window.lendStatusFilter) {
    const filtered = DATA.lends.filter(l => window.lendStatusFilter.includes(l.status));
    renderLendFiltered(filtered);
  }
}

function groupLendByPerson() {
  const grouped = {};
  
  DATA.lends.forEach(lend => {
    if (!grouped[lend.name]) {
      grouped[lend.name] = {
        name: lend.name,
        transactions: [],
        total: 0,
        pending: 0
      };
    }
    grouped[lend.name].transactions.push(lend);
    grouped[lend.name].total += lend.amount;
    if (lend.status !== 'Received') {
      grouped[lend.name].pending += lend.amount;
    }
  });
  
  return grouped;
}

function renderLendPersonSummary(grouped) {
  console.log('Lend Summary by Person:', grouped);
  // TODO: Render as cards or mini-list above main table
}

function renderLendFiltered(filtered) {
  // Sort by due date
  filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  // Highlight overdue
  filtered.forEach(l => {
    const dueDate = new Date(l.dueDate);
    const today = new Date();
    l.isOverdue = dueDate < today && l.status !== 'Received';
  });
  
  return filtered;
}

// ============================================================
// CARDS PAGE ENHANCEMENTS
// ============================================================

function enhanceCardsRendering() {
  // Show card summary if requested
  if (DrilldownState.currentFilter.showSummary) {
    renderCardSummary();
  }
}

function renderCardSummary() {
  const cardData = {};
  
  DATA.cards.forEach(card => {
    if (!cardData[card.name]) {
      cardData[card.name] = {
        name: card.name,
        total: 0,
        count: 0,
        oldestDate: null,
        transactions: []
      };
    }
    cardData[card.name].total += card.amount;
    cardData[card.name].count++;
    cardData[card.name].transactions.push(card);
    
    const txnDate = new Date(card.txnDate);
    if (!cardData[card.name].oldestDate || txnDate < new Date(cardData[card.name].oldestDate)) {
      cardData[card.name].oldestDate = card.txnDate;
    }
  });
  
  // Sort by outstanding amount (descending)
  const sorted = Object.values(cardData).sort((a, b) => b.total - a.total);
  
  console.log('Card Summary:', sorted);
  // TODO: Render as summary cards in cardSummaryGrid
}

// ============================================================
// COMMITMENTS PAGE ENHANCEMENTS
// ============================================================

function enhanceCommitmentsRendering() {
  if (window.commitStatusFilter) {
    const filtered = DATA.commitments.filter(c => c.status === window.commitStatusFilter);
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Highlight overdue
    const today = new Date();
    filtered.forEach(c => {
      c.isOverdue = new Date(c.dueDate) < today && c.status === 'Unpaid';
    });
    
    renderCommitmentsFiltered(filtered);
  }
}

function renderCommitmentsFiltered(filtered) {
  console.log('Filtered Commitments:', filtered);
  
  // Split upcoming vs overdue
  const today = new Date();
  const upcoming = filtered.filter(c => new Date(c.dueDate) >= today);
  const overdue = filtered.filter(c => new Date(c.dueDate) < today && c.status === 'Unpaid');
  
  return { upcoming, overdue };
}

// ============================================================
// CYCLE PAGE ENHANCEMENTS
// ============================================================

function enhanceCycleRendering() {
  if (window.cycleShowEfficiency) {
    analyzeCycleEfficiency();
  }
}

function analyzeCycleEfficiency() {
  const efficiency = {};
  const thisMonth = currentMonthKey();
  
  DATA.cycles.forEach(cycle => {
    if (monthKey(cycle.date) === thisMonth) {
      if (!efficiency[cycle.cardName]) {
        efficiency[cycle.cardName] = {
          cycles: 0,
          totalCharges: 0,
          totalWithdrawn: 0,
          avgCharge: 0
        };
      }
      efficiency[cycle.cardName].cycles++;
      efficiency[cycle.cardName].totalCharges += cycle.charges;
      efficiency[cycle.cardName].totalWithdrawn += cycle.withdrawn;
      efficiency[cycle.cardName].avgCharge = 
        efficiency[cycle.cardName].totalCharges / efficiency[cycle.cardName].cycles;
    }
  });
  
  console.log('Cycle Efficiency:', efficiency);
  return efficiency;
}

// ============================================================
// INVESTMENTS PAGE ENHANCEMENTS
// ============================================================

function enhanceInvestmentsRendering() {
  if (window.investShowAllocation) {
    renderInvestmentAllocation();
  }
}

function renderInvestmentAllocation() {
  const allocation = {};
  const total = DATA.investments.reduce((sum, i) => sum + i.amount, 0);
  
  DATA.investments.forEach(inv => {
    const type = extractInvestmentType(inv.name);
    
    if (!allocation[type]) {
      allocation[type] = 0;
    }
    allocation[type] += inv.amount;
  });
  
  // Calculate percentages
  const result = Object.entries(allocation).map(([type, amount]) => ({
    type,
    amount,
    percentage: ((amount / total) * 100).toFixed(1)
  }));
  
  console.log('Investment Allocation:', result);
  return result;
}

function extractInvestmentType(name) {
  // Try to extract type from investment name
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('mutual') || lowerName.includes('fund')) return 'Mutual Fund';
  if (lowerName.includes('stock') || lowerName.includes('equity')) return 'Stocks';
  if (lowerName.includes('fd') || lowerName.includes('fixed deposit')) return 'Fixed Deposit';
  if (lowerName.includes('bond')) return 'Bonds';
  if (lowerName.includes('crypto')) return 'Crypto';
  if (lowerName.includes('ppf')) return 'PPF';
  
  return 'Other';
}

// ============================================================
// NET POSITION DETAIL
// ============================================================

function showNetPositionDetail() {
  const totalCollect = DATA.lends
    .filter(l => l.status !== 'Received')
    .reduce((sum, l) => sum + l.amount, 0);
  
  const totalInvest = DATA.investments.reduce((sum, i) => sum + i.amount, 0);
  const totalCC = DATA.cards.reduce((sum, c) => sum + c.amount, 0);
  const totalCommit = DATA.commitments.reduce((sum, c) => sum + c.amount, 0);
  const totalCycleCharges = DATA.cycles.reduce((sum, c) => sum + c.charges, 0);
  
  const assets = totalCollect + totalInvest;
  const liabilities = totalCC + totalCommit + totalCycleCharges;
  const netPosition = assets - liabilities;
  
  const html = `
    <div class="overlay show" id="netPositionModal">
      <div class="confirm-box" style="max-width:500px;">
        <h3>💰 Net Financial Position</h3>
        
        <div style="text-align:left;margin:20px 0;">
          <h4 style="color:var(--green);margin-bottom:10px;">Assets (₹)</h4>
          <p>💰 Money to Collect: <strong>${fmt(totalCollect)}</strong></p>
          <p>📈 Investments: <strong>${fmt(totalInvest)}</strong></p>
          <p style="border-top:1px solid var(--border);padding-top:10px;">
            <strong>Total Assets: ${fmt(assets)}</strong>
          </p>
          
          <h4 style="color:var(--red);margin:20px 0 10px;">Liabilities (₹)</h4>
          <p>💳 Credit Card Outstanding: <strong>${fmt(totalCC)}</strong></p>
          <p>📅 Monthly Commitments: <strong>${fmt(totalCommit)}</strong></p>
          <p>🔄 Cycle Charges: <strong>${fmt(totalCycleCharges)}</strong></p>
          <p style="border-top:1px solid var(--border);padding-top:10px;">
            <strong>Total Liabilities: ${fmt(liabilities)}</strong>
          </p>
          
          <h4 style="color:${netPosition >= 0 ? 'var(--green)' : 'var(--red)'};margin:20px 0 10px;">
            Net Position: <strong>${fmt(netPosition)}</strong>
          </h4>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('netPositionModal').remove()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

// ============================================================
// INITIALIZATION
// ============================================================

// Initialize drill-down functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Give a short delay to ensure all elements are rendered
  setTimeout(() => {
    initDashboardDrilldown();
  }, 500);
});
