import nodemailer from 'nodemailer';

export async function sendAlertEmail(incidenceDetails, recipientEmails = []) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Error CRÍTICO: Las variables de entorno EMAIL_USER o EMAIL_PASS no están configuradas. El correo de alerta no se enviará.");
        return null;
    }

    const { tituloAemps, cn, lote, cantidad, enlace } = incidenceDetails;

    const toEmails = Array.isArray(recipientEmails) && recipientEmails.length > 0
        ? recipientEmails.join(',')
        : process.env.EMAIL_USER; // Fallback

    // Configurar Gmail con Contraseña de Aplicación
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Alerta CIMA Farmacovigilancia" <${process.env.EMAIL_USER}>`,
        to: toEmails,
        subject: `🚨 ALERTA FARMACOVIGILANCIA: ${tituloAemps}`,
        html: `
            <h2>🚨 ¡Alerta de Farmacovigilancia! 🚨</h2>
            <p>El sistema ha detectado un lote defectuoso de la AEMPS que actualmente se encuentra <b>en stock</b> en el hospital.</p>
            
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th>Código Nacional (CN)</th>
                    <th>Lote Afectado</th>
                    <th>Stock Actual en Hospital</th>
                </tr>
                <tr>
                    <td align="center">${cn}</td>
                    <td align="center"><b>${lote}</b></td>
                    <td align="center" style="color: red;"><b>${cantidad} unidades</b></td>
                </tr>
            </table>
            
            <br/>
            <h3>Detalles de la Alerta Oficial:</h3>
            <p><b>Aviso:</b> ${tituloAemps}</p>
            <p><b>Enlace AEMPS:</b> <a href="${enlace}">Leer el comunicado completo</a></p>
            
            <hr/>
            <p>Por favor, acuda a su panel de control para registrar la acción tomada (cuarentena, devolución, etc.) y marcar esta alerta como "Resuelta".</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo de alerta enviado con éxito:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error al enviar el correo:', error);
    }
}
