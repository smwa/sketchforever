let notebook = null;
let canvas_container = null;

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
  }, 0))
};

const canvas_close = async () => {
  notebook = null;
  window.history.back();
  canvas_container = null;
};
