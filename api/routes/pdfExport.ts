import { Router, type Request, type Response } from 'express';
import { authenticate } from '../src/middleware/auth.js';
import PDFDocument from 'pdfkit';
import { AppDataSource } from '../src/config/data-source.js';
import { Finding } from '../src/entities/Finding.js';
import { Program } from '../src/entities/Program.js';

const router = Router();

router.get('/export/:programId', authenticate, async (req: Request, res: Response) => {
    try {
        const { programId } = req.params;
        const userId = (req as any).user.id;

        // Fetch the program to ensure ownership
        const programRepo = AppDataSource.getRepository(Program);
        const program = await programRepo.findOne({
            where: { id: programId } // simplified query
        });

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        // Fetch findings for the program
        const findingRepo = AppDataSource.getRepository(Finding);
        const findings = await findingRepo.find({
            where: { program: { id: programId } },
            order: { severity: 'DESC' }
        });

        // Initialize PDF Document
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Security_Report_${program.name.replace(/\s+/g, '_')}.pdf`);
        
        // Pipe PDF to response stream
        doc.pipe(res);

        // Report Header
        doc.fontSize(24).font('Helvetica-Bold').text('Security Assessment Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).font('Helvetica').text(`Target: ${program.name}`, { align: 'center' });
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Executive Summary
        doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`This report contains the findings from the automated security assessment of ${program.name}. A total of ${findings.length} vulnerabilities were identified.`);
        doc.moveDown();

        // Findings Detail
        doc.fontSize(18).font('Helvetica-Bold').text('Detailed Findings');
        doc.moveDown();

        if (findings.length === 0) {
            doc.fontSize(12).font('Helvetica').text('No vulnerabilities were detected during the scan.', { align: 'center' });
        } else {
            findings.forEach((finding, index) => {
                doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${finding.title}`);
                doc.fontSize(10).font('Helvetica-Bold').text(`Severity: ${finding.severity.toUpperCase()}`);
                doc.moveDown(0.5);
                doc.fontSize(11).font('Helvetica-Bold').text('Description:');
                doc.fontSize(11).font('Helvetica').text(finding.description || 'No description provided.');
                doc.moveDown(0.5);
                doc.fontSize(11).font('Helvetica-Bold').text('Recommended Action:');
                doc.fontSize(11).font('Helvetica').text((finding as any).recommendedAction || 'No remediation provided.');
                doc.moveDown(1.5);
            });
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF report' });
        }
    }
});

export const pdfExportRouter = router;
