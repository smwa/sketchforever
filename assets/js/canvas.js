let notebook = null;
let canvas_container = null;
let easlejs_stage = null;
let line = null;

let pen_color = '#4169e1';
let pen_size = 0.25;
const MAX_PEN_SIZE_PIXELS = 36;
let is_erasing = false;

// keyed by evt.pointerId, store last known position, buttons, current line being drawn, and pointerType.
// May be used later to treat touch differently if there's a pen in use
const pointer_data = {};

const observeElementResize = (element, callback) => {
  const resizeObserver = new ResizeObserver(() => {
    callback();
  });
  resizeObserver.observe(element);
  return () => {
    resizeObserver.disconnect();
  };
};

const canvas_load_id = async (_id) => {
  try {
    notebook = (await LF.getItem(NOTEBOOK_KEY)).filter((notebook) => notebook.id === _id)[0];
  }
  catch (e) {
    window.location = './';
  }
  canvas_container = document.querySelector('.notebook-backdrop');

  const canvas = document.createElement('canvas');
  const canvas_container_bounding_rectangle = canvas_container.getBoundingClientRect();
  canvas.oncontextmenu = (evt) => {
    evt.preventDefault()
  };
  canvas.width = canvas_container_bounding_rectangle.width;
  canvas.height = canvas_container_bounding_rectangle.height;
  canvas.id = 'notebook-canvas';
  canvas.classList = 'notebook-canvas';
  canvas.onpointerdown = on_pointer_down;
  canvas.onpointermove = on_pointer_move;
  canvas.onpointerup = on_pointer_up;
  canvas_container.appendChild(canvas);
  observeElementResize(canvas_container, () => {
    const canvas_container_bounding_rectangle = document.querySelector('.notebook-backdrop').getBoundingClientRect();
    const canvas = document.querySelector('#notebook-canvas');
    canvas.width = canvas_container_bounding_rectangle.width;
    canvas.height = canvas_container_bounding_rectangle.height;
    setTimeout(() => {
      if (easlejs_stage) {
        easlejs_stage.update();
      }
    }, 0);
  });

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
  action_size_slider.value = 100 * pen_size;
  action_size_slider.min = 0;
  action_size_slider.max = 100;
  action_size_slider.classList = 'action-size-slider';
  action_size_slider_container.appendChild(action_size_slider);
  action_size.appendChild(action_size_slider_container);

  action_container.appendChild(action_size);

    // Eraser
    const action_eraser = document.createElement('div');
    action_eraser.classList = 'action-eraser';
    action_eraser.onclick = (e) => {
      is_erasing = !is_erasing;
      if (is_erasing) {
        document.querySelector('.action-eraser svg').classList.add('active');
      }
      else {
        document.querySelector('.action-eraser svg').classList.remove('active');
      }
    }
  
    const action_eraser_icon = document.createElement('i');
    action_eraser_icon.dataset.feather = 'delete';
    action_eraser.appendChild(action_eraser_icon);
  
    action_container.appendChild(action_eraser);

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
    
    easlejs_stage = new createjs.Stage("notebook-canvas");
    line = easlejs_stage.addChild(new createjs.Shape());
    line.cache(0,0,16000,16000);

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
  easlejs_stage = null;
};

const create_pointer_data = (evt) => {
  if (!pointer_data[evt.pointerId]) {
    pointer_data[evt.pointerId] = {
      pointerType: evt.pointerType,
      buttons: evt.buttons,
      position: {
        x: evt.clientX,
        y: evt.clientY,
      },
    };
  }
  pointer_data[evt.pointerId].buttons = evt.buttons;
};

const update_pointer_data = (evt) => {
  pointer_data[evt.pointerId].position.x = evt.clientX;
  pointer_data[evt.pointerId].position.y = evt.clientY;
};

const is_erasing_including_buttons = (pointer_id) => {
  return (is_erasing && (pointer_data[pointer_id].buttons & 1)) || (pointer_data[pointer_id].buttons & 32) || (pointer_data[pointer_id].buttons & 2);
}

const draw_line = (evt, from_x, from_y, to_x, to_y) => {
  if (evt.pressure < 0.0001) {
    return;
  }

  const _is_erasing = is_erasing_including_buttons(evt.pointerId);

  line.graphics
    .setStrokeStyle((1 + pen_size * MAX_PEN_SIZE_PIXELS) * evt.pressure * (_is_erasing ? 2.0 : 1.0), 'round')
    .beginStroke(pen_color);
  line.graphics.moveTo(from_x, from_y);
  line.graphics.lineTo(to_x, to_y);
  
  line.updateCache(_is_erasing ? "destination-out" : "source-over");
  line.graphics.clear();

  easlejs_stage.update();
};

const on_pointer_down = (evt) => {
  create_pointer_data(evt);

  if ((pointer_data[evt.pointerId].buttons & 1) || (pointer_data[evt.pointerId].buttons & 32) || (pointer_data[evt.pointerId].buttons & 2)) {
    draw_line(evt, evt.clientX, evt.clientY, evt.clientX, evt.clientY);
  }

  update_pointer_data(evt);
};

const on_pointer_move = (evt) => {
  create_pointer_data(evt);

  if ((pointer_data[evt.pointerId].buttons & 1) || (pointer_data[evt.pointerId].buttons & 32) || (pointer_data[evt.pointerId].buttons & 2)) {
    draw_line(evt, pointer_data[evt.pointerId].position.x, pointer_data[evt.pointerId].position.y, evt.clientX, evt.clientY);
  }

  update_pointer_data(evt);
};

const on_pointer_up = (evt) => {

};
