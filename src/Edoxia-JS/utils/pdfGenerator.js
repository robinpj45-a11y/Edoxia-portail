import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateClassPDF = (classLabel, students, teams) => {
    const doc = new jsPDF();
    const classStudents = students.filter(s => s.classLabel === classLabel);
    classStudents.sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

    doc.setFontSize(18);
    doc.setTextColor(0, 119, 182); 
    doc.text(`Classe : ${classLabel}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Effectif : ${classStudents.length} élèves`, 14, 28);

    const tableData = classStudents.map(s => {
        let lastName = s.lastName ? s.lastName.toUpperCase() : s.name.split(' ')[0].toUpperCase();
        let firstName = s.firstName ? s.firstName : s.name.split(' ').slice(1).join(' ');
        const teamName = s.team ? (teams.find(t => t.numId === s.team)?.name || `Équipe ${s.team}`) : "Non placé";
        return [lastName, firstName, teamName];
    });

    autoTable(doc, {
        startY: 35,
        head: [['Nom', 'Prénom', 'Équipe']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 119, 182] },
    });
    doc.save(`Classe_.pdf`);
};

export const generateTeamsPDF = (selectedTeamIds, teams, students) => {
    const doc = new jsPDF();
    let yPos = 20;

    selectedTeamIds.forEach((teamId, index) => {
        const team = teams.find(t => t.numId === teamId);
        if (!team) return;
        const teamStudents = students.filter(s => s.team === teamId);
        teamStudents.sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

        if (index > 0) { doc.addPage(); yPos = 20; }
        doc.setFontSize(22);
        doc.setTextColor(0, 119, 182); 
        doc.text(team.name.toUpperCase(), 105, yPos, { align: 'center' });
        yPos += 10;
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Nombre d'élèves : ${teamStudents.length}`, 105, yPos, { align: 'center' });

        const tableData = teamStudents.map(s => {
            let lastName = s.lastName ? s.lastName.toUpperCase() : s.name.split(' ')[0].toUpperCase();
            let firstName = s.firstName ? s.firstName : s.name.split(' ').slice(1).join(' ');
            return [lastName, firstName, s.classLabel];
        });

        autoTable(doc, {
            startY: yPos + 10,
            head: [['Nom', 'Prénom', 'Classe']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 119, 182] },
        });
    });
    doc.save(`Equipes_Selection.pdf`);
};
