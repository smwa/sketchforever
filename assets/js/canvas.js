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

  const action_handle = document.createElement('div');
  action_handle.classList = 'action-handle';

  const action_handle_icon = document.createElement('i');
  action_handle_icon.dataset.feather = 'align-justify';
  action_handle.appendChild(action_handle_icon);

  action_container.appendChild(action_handle);

  canvas_container.appendChild(action_container);


  make_action_container_draggable(action_container);

  requestAnimationFrame(() => setTimeout(() => {
    feather.replace();
  }, 0))
};

const canvas_close = async () => {
  notebook = null;
  window.history.back();
  canvas_container = null;
};

const make_action_container_draggable = (action_container) => {

  const dragMouseDown = (e) => {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  const elementDrag = (e) => {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    action_container.style.top = Math.min(canvas_container.scrollHeight - 48, Math.max(0, (action_container.offsetTop - pos2))) + "px";
    action_container.style.left = Math.min(canvas_container.scrollWidth - 48, Math.max(0, (action_container.offsetLeft - pos1))) + "px";
  }

  const closeDragElement = () => {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
  
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  document.querySelector('.action-handle').onmousedown = dragMouseDown;
};
