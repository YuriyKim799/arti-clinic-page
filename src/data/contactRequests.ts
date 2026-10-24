export const contactRequests = {
  'online-consultation': {
    title: 'Онлайн-консультация',
    description: 'Оставьте контакты — администратор согласует с вами время и формат консультации.',
    successTitle: 'Заявка на онлайн-консультацию отправлена.',
    successDescription: 'Администратор свяжется с вами, чтобы согласовать время и формат консультации.',
  },
  'exercise-collection': {
    title: 'Сборник упражнений',
    description: 'Оставьте контакты — администратор свяжется с вами и расскажет, как приобрести сборник упражнений.',
    successTitle: 'Заявка на сборник упражнений отправлена.',
    successDescription: 'Администратор свяжется с вами и расскажет, как приобрести сборник.',
  },
} as const;

export type AppointmentType = 'appointment' | keyof typeof contactRequests;
