let notebook = null;
let canvas_container = null;

let pen_color = '#4169e1';
let pen_size = 0.5;

const canvas_load_id = async (_id) => {
  try {
    notebook = (await LF.getItem(NOTEBOOK_KEY)).filter((notebook) => notebook.id === _id)[0];
  }
  catch (e) {
    window.location = './';
  }
  canvas_container = document.querySelector('.notebook-backdrop');

  const action_container = document.createElement('div');
  action_container.classList = 'action-container';


  // Handle
  const action_handle = document.createElement('div');
  action_handle.classList = 'action-handle';

  const action_handle_icon = document.createElement('i');
  action_handle_icon.dataset.feather = 'align-justify';
  action_handle.appendChild(action_handle_icon);

  action_container.appendChild(action_handle);

  // Color Picker
  const action_color = document.createElement('div');
  action_color.classList = 'action-color-picker';

  const action_color_icon = document.createElement('i');
  action_color_icon.dataset.feather = 'aperture';
  action_color.appendChild(action_color_icon);

  action_container.appendChild(action_color);

  // Size Picker
  const action_size = document.createElement('div');
  action_size.classList = 'action-size-picker';
  action_size.onclick = (e) => {
    if (e.target.closest('.action-size-slider-container') !== null) return;
    const slider_container = document.querySelector('.action-size-slider-container');
    if (slider_container.classList.contains('hidden')) {
      slider_container.classList.remove('hidden');
    }
    else {
      slider_container.classList.add('hidden');
    }
  }

  const action_size_icon = document.createElement('i');
  action_size_icon.dataset.feather = 'edit-2';
  action_size.appendChild(action_size_icon);

  const action_size_slider_container = document.createElement('div');
  action_size_slider_container.classList = 'action-size-slider-container hidden';
  const action_size_slider = document.createElement('input');
  action_size_slider.onchange = (evt) => {
    pen_size = (parseInt(evt.target.value, 10) / 100.0).toFixed(2);
  };
  action_size_slider.type = 'range';
  action_size_slider.min = 0;
  action_size_slider.max = 100;
  action_size_slider.classList = 'action-size-slider';
  action_size_slider_container.appendChild(action_size_slider);
  action_size.appendChild(action_size_slider_container);

  action_container.appendChild(action_size);


  // Home
  const action_home = document.createElement('div');
  action_home.classList = 'action-full-screen';
  action_home.onclick = (e) => {
    window.history.back();
  }

  const action_home_icon = document.createElement('i');
  action_home_icon.dataset.feather = 'home';
  action_home.appendChild(action_home_icon);

  action_container.appendChild(action_home);


  // Full screen
  const action_full_screen = document.createElement('div');
  action_full_screen.classList = 'action-full-screen';
  action_full_screen.onclick = (e) => {
    if (document.fullscreenElement === null) {
      canvas_container.requestFullscreen();
    }
    else {
      document.exitFullscreen();
    }
  }

  const action_full_screen_icon = document.createElement('i');
  action_full_screen_icon.dataset.feather = 'maximize-2';
  action_full_screen.appendChild(action_full_screen_icon);

  action_container.appendChild(action_full_screen);


  // Action container
  canvas_container.appendChild(action_container);

  const canvas_container_position = { x: 0, y: 0 }
  interact('.action-container')
  .draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],
    allowFrom: '.action-handle',
    listeners: {
      move (event) {
        canvas_container_position.x += event.dx
        canvas_container_position.y += event.dy
  
        event.target.style.transform =
          `translate(${canvas_container_position.x}px, ${canvas_container_position.y}px)`
      },
    }
  });

  requestAnimationFrame(() => setTimeout(() => {
    feather.replace();   
    
    const pickr = Pickr.create({
      el: '.action-color-picker',
      theme: 'monolith',
      default: pen_color,
      container: '.notebook-backdrop',
      components: {
          preview: true,
          opacity: true,
          hue: true,
  
          interaction: {
              hex: false,
              rgba: false,
              hsla: false,
              hsva: false,
              cmyk: false,
              input: true,
              clear: false,
              cancel: true,
              save: true
          }
      }
    });

    pickr.on('init', instance => {
      const {result} = instance.getRoot().interaction;
      result.addEventListener('keydown', e => {
          // Detect whever the user pressed "Enter" on their keyboard
          if (e.key === 'Enter') {
              instance.applyColor(); // Save the currently selected color
              instance.hide(); // Hide modal
          }
      }, {capture: true});
  });

  pickr.on('save', (color, instance) => {
    pen_color = '#' + color.toHEXA().join('');
    instance.hide();
  });

  pickr.on('cancel', (instance) => {
    instance.hide();
  });

  }, 0))
};

const canvas_close = async () => {
  notebook = null;
  window.history.back();
  canvas_container = null;
};
