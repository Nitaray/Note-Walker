class Board {
  constructor(musicSheet, size) {
    this.size = size;
    this.activatedColor = "#ffffcc";
    this.normalColor = "#ffa64d";

    let notes = MusicBox.analyze(musicSheet);
    this.generateMap(notes);
    // this.buildObstacles();
  }

  gridSize(){
    return this.size;
  }

  index(x, y){
    return this.size * y + x;
  }

  generateMap(notes){
    let size = this.gridSize();
    // Start point
    let start = {
      x : Math.floor(Math.random() * size),
      y : Math.floor(Math.random() * size),
      possibleDirecions : ['u', 'd', 'l', 'r']
    };

    let draft = new Array(size * size); // A draft
    draft.set = function(x, y, value){
      draft[x + y * size] = value;
    };
    draft.get = function(x, y){
      return draft[x + y * size];
    }

    if(!REPEATING_NOTES)
      draft.set(start.x, start.y, '$');

    let stack = [];
    stack.push(start);
    while(stack.length > 0 && stack.length != notes.length + 1){
      let nextNote = notes[stack.length - 1];
      let prev = stack[stack.length - 1];
      if(prev.possibleDirecions.length <= 0){
        draft.set(prev.x, prev.y, prev.previousNote);
        stack.pop();
        continue;
      }
      let dir = prev.possibleDirecions.random();
      let next = {};
      switch(dir){
        case 'u':
          next.x = prev.x;
          next.y = prev.y - 1;
          break;
        case 'd':
          next.x = prev.x;
          next.y = prev.y + 1;
          break;
        case 'l':
          next.x = prev.x - 1;
          next.y = prev.y;
          break;
        case 'r':
          next.x = prev.x + 1;
          next.y = prev.y;
          break;
      }

      let index = prev.possibleDirecions.indexOf(dir);
      prev.possibleDirecions.splice(index, 1);

      let isValid = function() {
        if(next.x < 0 || next.x >= size || next.y < 0 || next.y >= size)
          return false;
        let dest = draft.get(next.x, next.y);
        if(!dest) return true;
        return REPEATING_NOTES && dest == nextNote;
      };

      if(isValid()){
        stack.push({
          x : next.x,
          y : next.y,
          possibleDirecions : ['u', 'd', 'l', 'r'],
          previousNote : draft.get(next.x, next.y)
        });
        draft.set(next.x, next.y, nextNote);
      }
    }

    if(stack.length == 0){
      alert("CAN't GENEREATE MAPPE");
      return;
    }

    this.startPoint = start;
    this.data = new Array(this.gridSize() * this.gridSize());
    for(let i = 0; i<this.data.length; i++){
      this.data[i] = {
        cooldown: 0,
        note: draft[i] || ''
      }
    }
  }

  buildObstacles(){
    for(let i = 0; i < this.data.length; i++){
      let n = this.data[i].note;
      if(n) continue;
      this.data[i].isObstacle = true;
    }
  }

  getStartPoint(){
    return {x : this.startPoint.x, y : this.startPoint.y};
  }

  activate(x, y) {
    let note = this.data[x + y * this.gridSize()].note;
    if(!note)
      return;
    if(MusicBox.play(note))
      this.data[x + y*this.gridSize()].cooldown = 1;
  }

  update() {
    for(let i = 0; i<this.data.length; i++)
      this.data[i].cooldown *= 0.95;
  }

  display() {
    context.lineWidth = 1;
    for(let i = 0; i<this.gridSize(); i++)
      for(let j = 0; j<this.gridSize(); j++){
        let cell = this.data[i + j*this.gridSize()];
        if(cell.isObstacle)
          continue;

        context.fillStyle = lerpColor(this.normalColor, this.activatedColor, cell.cooldown);

        context.strokeStyle = 'black';
        let u = cellSize();
        let p = 0.9; // ratio padding
        let r = u * 0.1; // round corner
        let x = i * u + (1 - p) * u / 2;
        let y = j * u + (1 - p) * u / 2;
        context.beginPath();
        context.roundedRectangle(x , y, u * p, u * p, r);
        context.fill();
        context.stroke();

        x = i * u + u/2;
        y = j * u + u/2;
        context.fillStyle = "rgb(120, 80, 27)"
        context.strokeStyle = "black";
        context.font = u / 3 + "px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        let noteText = MusicBox.toText(cell.note);
        context.fillText(noteText[0] || "", x, y);
        context.font = u / 5 + "px Arial";
        context.fillText(noteText[1] || "", x + u/4, y + u/4);
      }
  }
}
