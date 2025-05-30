import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
  // Calendar functionality
  const calendarDays = document.getElementById('calendar-days');
  const currentMonthYear = document.getElementById('current-month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const timeSlots = document.getElementById('time-slots');
  const slotsContainer = timeSlots.querySelector('.slots-container');
  const selectDateMessage = timeSlots.querySelector('.select-date-message');
  const continueBtn = document.getElementById('continue-to-step-2');

  // Booking steps
  const bookingStep1 = document.getElementById('booking-step-1');
  const bookingStep2 = document.getElementById('booking-step-2');
  const bookingStep3 = document.getElementById('booking-step-3');
  const backToStep1Btn = document.getElementById('back-to-step-1');
  const contactForm = document.getElementById('contact-form');

  // Contact method radios
  const contactMethodRadios = document.querySelectorAll('input[name="contact-method"]');
  const telegramField = document.getElementById('telegram-field');
  const vkField = document.getElementById('vk-field');

  // Artists select
  const artistSelect = document.getElementById('artist');

  // Current date
  let currentDate = new Date();
  let selectedDate = null;
  let selectedTimeSlot = null;

  // Month names in Russian
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Calendar generation
  function generateCalendar(year, month) {
    calendarDays.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Update month and year display
    currentMonthYear.textContent = `${monthNames[month]} ${year}`;
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Adjust for Monday as first day of week
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Create empty cells for days before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      calendarDays.appendChild(emptyDay);
    }
    
    // Create cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.textContent = day;
      
      // Check if this is the selected date
      if (selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
        dayCell.classList.add('selected');
      }
      
      dayCell.addEventListener('click', () => {
        // Remove selected class from previously selected day
        const previouslySelected = document.querySelector('.days div.selected');
        if (previouslySelected) {
          previouslySelected.classList.remove('selected');
        }
        
        // Add selected class to clicked day
        dayCell.classList.add('selected');
        
        // Update selected date
        selectedDate = new Date(year, month, day);
        
        // Generate time slots for selected date
        generateTimeSlots(selectedDate);
      });
      
      calendarDays.appendChild(dayCell);
    }
  }

  // Generate time slots for selected date
  function generateTimeSlots(date) {
    // Show time slots section and hide message
    selectDateMessage.style.display = 'none';
    slotsContainer.style.display = 'grid';
    slotsContainer.innerHTML = '';
    
    // Define available hours
    const startHour = 10; // 10:00
    const endHour = 21;   // 21:00
    
    // Generate time slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 60) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        
        // Format time (e.g., "14:00")
        const timeString = `${hour}:${minute === 0 ? '00' : minute}`;
        timeSlot.textContent = timeString;
        
        timeSlot.addEventListener('click', () => {
          // Remove selected class from previously selected time slot
          const previouslySelected = document.querySelector('.time-slot.selected');
          if (previouslySelected) {
            previouslySelected.classList.remove('selected');
          }
          
          // Add selected class to clicked time slot
          timeSlot.classList.add('selected');
          
          // Update selected time slot
          selectedTimeSlot = timeString;
          
          // Enable continue button
          continueBtn.disabled = false;
        });
        
        slotsContainer.appendChild(timeSlot);
      }
    }
  }

  // Previous month button click
  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  // Next month button click
  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  // Continue to step 2 button click
  continueBtn.addEventListener('click', () => {
    bookingStep1.classList.remove('active');
    bookingStep2.classList.add('active');
  });

  // Back to step 1 button click
  backToStep1Btn.addEventListener('click', () => {
    bookingStep2.classList.remove('active');
    bookingStep1.classList.add('active');
  });

  // Contact form submission
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const bookingData = {
      client_name: formData.get('name'),
      phone: formData.get('phone'),
      contact_method: formData.get('contact-method'),
      contact_details: formData.get(formData.get('contact-method')),
      booking_date: selectedDate.toISOString().split('T')[0],
      booking_time: selectedTimeSlot,
      description: formData.get('description'),
      artist_id: formData.get('artist') || null,
      status: 'pending'
    };
    
    try {
      // Insert booking into database
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      // Update confirmation details
      document.getElementById('confirmation-date').textContent = selectedDate.toLocaleDateString('ru-RU');
      document.getElementById('confirmation-time').textContent = selectedTimeSlot;
      document.getElementById('confirmation-name').textContent = bookingData.client_name;
      
      // Show success message
      bookingStep2.classList.remove('active');
      bookingStep3.classList.add('active');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Произошла ошибка при создании записи. Пожалуйста, попробуйте снова.');
    }
  });

  // Contact method change
  contactMethodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const method = radio.value;
      
      // Show/hide appropriate fields
      if (method === 'telegram') {
        telegramField.style.display = 'block';
        vkField.style.display = 'none';
        document.getElementById('telegram').required = true;
        document.getElementById('vk').required = false;
      } else if (method === 'vk') {
        telegramField.style.display = 'none';
        vkField.style.display = 'block';
        document.getElementById('telegram').required = false;
        document.getElementById('vk').required = true;
      } else {
        telegramField.style.display = 'none';
        vkField.style.display = 'none';
        document.getElementById('telegram').required = false;
        document.getElementById('vk').required = false;
      }
    });
  });

  // Phone number formatting
  const phoneInput = document.getElementById('phone');
  phoneInput.addEventListener('input', function(e) {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      let formattedValue;
      if (value.length <= 1) {
        formattedValue = `+7 (${value}`;
      } else if (value.length <= 4) {
        formattedValue = `+7 (${value.substring(0, 3)}`;
      } else if (value.length <= 7) {
        formattedValue = `+7 (${value.substring(0, 3)}) ${value.substring(3)}`;
      } else if (value.length <= 9) {
        formattedValue = `+7 (${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
      } else {
        formattedValue = `+7 (${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 8)}-${value.substring(8, 10)}`;
      }
      e.target.value = formattedValue;
    }
  });

  // Load artists for select
  async function loadArtists() {
    try {
      const { data: artists, error } = await supabase
        .from('artists')
        .select('id, name');

      if (error) throw error;

      const artistSelect = document.getElementById('artist');
      artistSelect.innerHTML = '<option value="">Без предпочтений</option>';
      
      artists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist.id;
        option.textContent = artist.name;
        artistSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading artists:', error);
    }
  }

  // Initialize calendar with current month
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  
  // Initialize artists select
  loadArtists();
});