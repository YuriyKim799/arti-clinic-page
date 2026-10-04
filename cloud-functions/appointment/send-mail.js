const SMTPConnection = require('nodemailer/lib/smtp-connection');
const MailComposer = require('nodemailer/lib/mail-composer');

// One connection per invocation. An overall deadline closes the socket,
// including when authentication or the final SMTP acknowledgement stalls.
exports.sendMail = ({ user, password }, message) => new Promise((resolve, reject) => {
  const connection = new SMTPConnection({
    host: 'smtp.mail.ru', port: 465, secure: true,
    connectionTimeout: 5000, greetingTimeout: 5000,
    socketTimeout: 10000, dnsTimeout: 5000,
    logger: false, debug: false,
    tls: { minVersion: 'TLSv1.2' },
  });
  let finished = false;
  const finish = (error, info) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    connection.close();
    if (error) reject(error);
    else resolve(info);
  };
  const timer = setTimeout(() => {
    finish(Object.assign(new Error('Mail delivery deadline exceeded'), { code: 'ETIMEDOUT' }));
  }, 20000);
  connection.on('error', error => finish(error));
  connection.on('end', () => {
    if (!finished) finish(Object.assign(new Error('SMTP connection ended'), { code: 'ECONNECTION' }));
  });

  try {
    const mail = new MailComposer({
      ...message, disableFileAccess: true, disableUrlAccess: true,
    }).compile();
    mail.build((error, buffer) => {
      if (finished) return;
      if (error) return finish(error);
      connection.connect(() => {
        if (finished) return;
        connection.login({ user, pass: password }, error => {
          if (finished) return;
          if (error) return finish(error);
          connection.send(mail.getEnvelope(), buffer, (error, info) => finish(error, info));
        });
      });
    });
  } catch (error) {
    finish(error);
  }
});
