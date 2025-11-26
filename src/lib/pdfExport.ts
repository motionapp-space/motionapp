import type { Day } from "@/types/plan";

export interface PlanExportData {
  name: string;
  days: Day[];
  objective?: string;
  durationWeeks?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;  // Legacy support
  updatedAt?: string;  // Legacy support
}

export const exportPlanToPDF = (plan: PlanExportData) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Abilita i popup per scaricare il PDF');
    return;
  }

  const phaseLabels: Record<string, string> = {
    "Warm-up": "Riscaldamento",
    "Main Workout": "Corpo principale",
    "Stretching": "Stretching",
  };

  const objectiveLabels: Record<string, string> = {
    Strength: "Forza",
    Hypertrophy: "Ipertrofia",
    Endurance: "Resistenza",
    Mobility: "Mobilità",
    HIIT: "HIIT",
    Functional: "Funzionale",
  };

  // Get dates (support both camelCase and snake_case)
  const createdDate = plan.created_at || plan.createdAt;
  const updatedDate = plan.updated_at || plan.updatedAt;

  // Generate HTML content with tokenized styles
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>${plan.name}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          margin: 24px 32px;
          size: A4;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Montserrat', system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #1a1a1a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .header {
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e5e5;
        }
        
        h1 {
          font-size: 32px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin-bottom: 12px;
        }
        
        .meta {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .day {
          margin-bottom: 32px;
          page-break-inside: avoid;
        }
        
        .day-title {
          font-size: 24px;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 16px;
        }
        
        .section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        
        .section-header {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
        }

        .group-header {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          margin-top: 12px;
          color: #555;
          padding: 6px 12px;
          background-color: #f8f8f8;
          border-left: 4px solid #666;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        th {
          background-color: #f5f5f5;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        
        td {
          padding: 8px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .empty-section {
          color: #999;
          font-style: italic;
          padding: 16px;
          text-align: center;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${plan.name}</h1>
        ${plan.objective || plan.durationWeeks ? `
          <div class="meta">
            ${plan.objective ? `<div class="meta-item"><strong>Obiettivo:</strong> ${objectiveLabels[plan.objective] || plan.objective}</div>` : ''}
            ${plan.durationWeeks ? `<div class="meta-item"><strong>Durata:</strong> ${plan.durationWeeks} settimane</div>` : ''}
          </div>
        ` : ''}
        ${createdDate || updatedDate ? `
          <div class="meta">
            ${createdDate ? `<div class="meta-item"><strong>Creato:</strong> ${new Date(createdDate).toLocaleDateString('it-IT')}</div>` : ''}
            ${updatedDate ? `<div class="meta-item"><strong>Aggiornato:</strong> ${new Date(updatedDate).toLocaleDateString('it-IT')}</div>` : ''}
          </div>
        ` : ''}
      </div>
      
      ${plan.days.map((day) => `
        <div class="day">
          <h2 class="day-title">${day.title}</h2>
          ${day.phases.map((phase) => {
            // Flatten exercises from groups (supports new structure)
            const allExercises = phase.groups?.flatMap(g => g.exercises) || [];
            const exerciseCount = allExercises.length;
            
            return `
              <div class="section">
                <h3 class="section-header">
                  ${phaseLabels[phase.type] || phase.type} 
                  (${exerciseCount} ${exerciseCount === 1 ? 'esercizio' : 'esercizi'})
                </h3>
                ${exerciseCount === 0 ? `
                  <div class="empty-section">Nessun esercizio</div>
                ` : `
                  ${phase.groups?.map((group) => {
                    const groupLabel = group.type === 'superset' 
                      ? 'Superset' 
                      : group.type === 'circuit' 
                        ? `Circuito${group.rounds ? ` (${group.rounds} giri)` : ''}` 
                        : '';
                    
                    return `
                      ${groupLabel ? `<div class="group-header">${groupLabel}</div>` : ''}
                      <table>
                        <thead>
                          <tr>
                            <th style="width: 25%;">Nome</th>
                            <th style="width: 8%;">Serie</th>
                            <th style="width: 10%;">Rip</th>
                            <th style="width: 12%;">Carico</th>
                            <th style="width: 10%;">Rec</th>
                            <th style="width: 20%;">Note</th>
                            <th style="width: 15%;">🎯 Obiettivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${group.exercises
                            .sort((a, b) => a.order - b.order)
                            .map((ex) => `
                              <tr>
                                <td>${ex.name || '-'}</td>
                                <td>${ex.sets}</td>
                                <td>${ex.reps}</td>
                                <td>${ex.load || '-'}</td>
                                <td>${ex.rest || '-'}</td>
                                <td>${ex.notes || '-'}</td>
                                <td>${ex.goal || '-'}</td>
                              </tr>
                            `).join('')}
                        </tbody>
                      </table>
                    `;
                  }).join('') || ''}
                `}
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};
