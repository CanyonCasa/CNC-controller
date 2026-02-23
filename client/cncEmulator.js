/**
  Functions emulating a 3-axis CNC for calculating a timing estimate 
  and creating a simple visualization for verifying file ...
  A universal class that works in Node.js and browsers without a bundler.
 */

// code for differentiating NodeJS and browser environments...
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node.js/CommonJS environment
        console.info('Loading CNC class library for Node...');
        module.exports = factory();
    } else {
        // Browser environment (IIFE)
        console.info('Loading CNC class library for Browser...');
        root.CNCEmulator = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {


// helper functions...
function dotProduct(u,v) {
    return u.X*v.X + u.Y*v.Y + u.Z*v.Z 
}

function magnitude(vector) {  // magnitude of a 3D vector
    return Math.sqrt(vector.X**2 + vector.Y**2 + vector.Z**2);
}

// Emulation class... requires a machine definition!
class CNCEmulator {

    static CW = -1;
    static ALIGNED = 0;
    static CCW = 1;

    constructor(machine={}) {
        this.machine = machine; // machine specific parameters; maxFeed definition required
        if (!('maxFeed' in this.machine)) throw `No required MAX Feed rate defined for machine!`;
        this.cncInit(); // initialize the CNC position and data
    }

    // computes a number of terms required for determining arc distance and drawing parameters
    calcArcParams(direction) {
        let geometry = 'arc'; // label differentiating calculated arc data from line data.
        let data = this.line.parameters;
        let location = Object.assign({},this.position); // make a copy of the position object
        let center = { X:location.X+data.I, Y:location.Y+data.J, Z:location.Z+data.K }; // locate the arc center
        // normalize vectors (i.e. 0,0 origin) and determine each vector's angle from x-axis and acute angle between them (theta)
        let fromVector = { X:location.X-center.X, Y:location.Y-center.Y, Z:location.Z-center.Z }; 
        let fromVectorAngle = Math.atan2(fromVector.Y,fromVector.X); 
        let toVector = { X:data.X-center.X, Y:data.Y-center.Y, Z:data.Z-center.Z };
        let toVectorAngle = Math.atan2(toVector.Y,toVector.X);
        let theta = Math.acos(Math.max(-1, Math.min(1,dotProduct(fromVector,toVector)/(magnitude(fromVector)*magnitude(toVector)))));
        // compute full circle values
        let radius = magnitude(fromVector); // or magnitude(toVector); assumed the same, no error checking
        let circumference = 2 * Math.PI * radius;
        // compute X1Y2 - X2Y1 for acute angle direction; 0 = Pi or 2*Pi, <0 = CW, >0 = CCW
        // check if the acute angle (rotation) repreents the path traveled according to the instruction 
        let check = Math.sign(fromVector.X*toVector.Y - toVector.X*fromVector.Y);
        let fullCircle = (check === 0) && (location.X===data.X) && (location.Y===data.Y); // if beginning and end the same
        // computed distance for various cases...
        let distance = theta * radius; // initial (default) guess
        if (check===CNCEmulator.ALIGNED) {
            distance = fullCircle ? circumference : circumference/2; // 0 or Pi radians
        } else if ((check===CNCEmulator.CW && direction==CNCEmulator.CCW) || (check===CNCEmulator.CCW && direction===CNCEmulator.CW)) {
            distance = circumference - distance; // accute angle opposite of specified direction
        };
        this.line.calculatedData = { geometry, center,fromVector,toVector,radius, circumference, fromVectorAngle, toVectorAngle, theta, 
            check, fullCircle, direction, distance, location};
        return this.line.calculatedData;
    }

    // computes data needed for a linear path...
    calcLinearParams() {
        let geometry = 'line'; // differentiates data as a line
        let distance = magnitude({ 
            X: this.line.parameters.X-this.position.X,
            Y: this.line.parameters.Y-this.position.Y,
            Z: this.line.parameters.Z-this.position.Z
        });
        this.line.calculatedData = { geometry, distance };
        return this.line.calculatedData;
    }

    // these instructions perform operations other than moving the CNC position
    // NOTE: nothing actually done with this information presently!
    cncControl() {
        switch (this.line.parsedParams.G) {
            case 20:
                this.machine.units = 'inches';
                break;
            case 21:
                this.machine.units = 'mm';
                break;
            case 54:
                break;
            case 90:
                this.machine.positioning = 'absolute';
                break;
            //case 91:
            //    this.machine.positioning = 'relative';
            //    break;
            default:
                console.warn(`UNKNOWN/UNSUPPORTED GCODE[${this.line.number}]: ${this.line.raw}`);
                break;
        };
    }

    // motor control instruction interpretation; 
    // returns an object with spindle state and speed information based on the M code
    cncMotorStatus(line, number) {
        let params = this.parseLine(line);
        switch (params.M) {
            case 2: return {spindleCode:'M2', spindle:'OFF', spindleSpeed:0};
            case 3: // if spindle direction not fixed, set to CW, otherwise machine default direction
                return {spindleCode:'M3', spindle:!this.machine.spindleDirectionFixed ? 'CW' : this.machine.spindleDirection, spindleSpeed:params.S};
            case 4:
                // if spindle direction not fixed, set to CCW, otherwise machine default direction
                return {spindleCode:'M4', spindle:!this.machine.spindleDirectionFixed ? 'CCW' : this.machine.spindleDirection, spindleSpeed:params.S};
            case 5:
                return {spindleCode:'M5', spindle:'OFF', spindleSpeed:0};
            default:
                console.warn(`UNKNOWN/UNSUPPORTED MCODE[${number}]: ${line}`);
                return {};
        };
    }

    // reset the CNC position and clear out previously generated data
    cncInit() {
        this.position = { X: 0.0, Y: 0.0, Z: 0.0 };     // current C?NC location
        this.runTime = 0.0;                             // total job run time
        this.gcodeLines = [];                           // the raw GCODE lines for the job
        this.gcodeData = [];                            // collection of the computed data for the job
    }

    // move the CNC to a new position
    cncReposition() {
        for (const key of Object.keys(this.position)) {
            this.position[key] = key in this.line.parameters ? this.line.parameters[key] : this.position[key];
        }
    }

    // compute the distance travels for the particular instruction
    computeTravel() {
        switch (this.line.parsedParams.G) {
            case 0: // fast linear movement
            case 1: // slow linear movement
                return this.calcLinearParams();
            case 2: // clockwise circular movement
                return this.calcArcParams(CNCEmulator.CW);
            case 3: // counter clockwise movement
                return this.calcArcParams(CNCEmulator.CCW);
        };
        return {}; // assume P in ms and S in secs
    }

    // generate an estimate of the time (ms) required to execute an instruction
    // based on per instruction feed rate (mm/min) and distance traveled (mm)
    // NO acceleration profile presently used
    computeInstructiontime() {
        let g = this.line.parameters.G;
        // G4 is a pause, no distance; assume parameter P in ms and S in secs
        if (g===4) return (this.line.parameters.P || this.line.parameters.S*1000 || 0);
        let feed = this.feedRate(!!g);  // G0 at max feed others at set rate
        let it = 60000 * this.line.calculatedData.distance / feed; // convert from minutes to milliseconds
        return it; 
    }

    // determines feed rate from defition or instruction
    feedRate(max) {
        if (!!max) return this.machine.maxFeed;
        if (!this.line.parameters.F) throw `No Feed rate set[${this.line.number}]: ${this.line.raw}`;
        return this.line.parameters.F;
    }

    // converts gcode instructions data (gcodeData) into formats needed for canvas drawing instructions
    prepViewData() { 
        this.viewData = [];
        let position = [0,0,0];
        for (let path of this.gcodeData) {
            if (path.mode==='NOP') continue;
            let {calculatedData:calc, parameters:params} = path;
            let instruction = { path: path, geometry:calc.geometry, stroke: path.mode, moveTo: [position[0],position[1]] };
            if (calc.geometry==='arc') {
                let ccw = calc.direction === 1; // couter clockwise flag
                instruction.arc = [calc.center.X, calc.center.Y, calc.radius, calc.fromVectorAngle, calc.toVectorAngle, ccw ];
            } else {
                instruction.lineTo = [params.X, params.Y]; // i.e. calc.geometry==='line'
            };
            position = [params.X, params.Y, params.Z];  // new position is the instruction's target position
            instruction.positionTo = position;
            this.viewData.push(instruction);
        };
        return this.viewData;
    }

    // determines job movement limts and creates an autoscaled bounding box with margin
    prepViewLimits() {
        let bound = (v,s=1.2)=>10*Math.trunc(s*v/10);
        let drawn = { xmin:0, ymin:0, xmax:0, ymax:0 };
        for (let data of this.gcodeData) {
            let {calculatedData:calc, parameters:params} = data;
            if (params.X<drawn.xmin) drawn.xmin = params.X;
            if (params.X>drawn.xmax) drawn.xmax = params.X;
            if (params.Y<drawn.ymin) drawn.ymin = params.Y;
            if (params.Y>drawn.ymax) drawn.ymax = params.Y;
        };
        let box = Object.keys(drawn).reduce((obj,k)=>{obj[k]=bound(drawn[k]); return obj},{});
        drawn = Object.assign(drawn,{dx:drawn.xmax-drawn.xmin, dy:drawn.ymax-drawn.ymin, x:(drawn.xmax+drawn.xmin)/2, y:(drawn.ymax+drawn.ymin)/2});
        box = Object.assign(box,{dx:box.xmax-box.xmin, dy:box.ymax-box.ymin, x:(box.xmax+box.xmin)/2, y:(box.ymax+box.ymin)/2});
        return {drawn,box};
    };

    // convert GCODE into line records while computing run time in seconds
    processGCODE(gcodeLines) {
        this.cncInit(); // reset the CNC position and data
        this.gcodeLines = gcodeLines;
        let lineNumber = 0;
        let parameters = { X: 0.0, Y: 0.0, Z: 0.0 }; // modal data
        for (const line of gcodeLines) {
            this.line = { raw: line, number: ++lineNumber, mode: 'NOP' };
            this.line.parsedParams = this.parseLine(this.line.raw);
            this.line.parameters = Object.assign({},this.line.parsedParams,parameters);
            if (this.line.raw.startsWith('G')) { // only GCODE "G" instrutions processed for timing...
                let G = this.line.parsedParams.G;
                this.line.mode = G===0 ? 'MOVE' : G<4 ? 'CUT' : 'NOP'; // G0 is a MOVE, G1-3 are CUT, G4 is a NOP
                if (G<5) {  // only movement instructions
                    this.line.calculatedData = this.computeTravel();
                    this.line.instructionTime = this.computeInstructiontime();
                    this.runTime += this.line.instructionTime;
                    this.gcodeData.push(this.line);
                    this.cncReposition();
                } else {
                    this.cncControl();
                };
            };
        }
        if (this.machine.fudge) this.runTime *= this.machine.fudge; // option fudge factor adjustment
        return this.runTime;
    }

    // parses a GBRL line into a set of parameters
    parseLine(line) {
        let params = {};
        let re = RegExp('(?<!\s)([A-Za-z])','g')
        line = line.replace(re,(p)=>` ${p.toUpperCase()}`).trim(); // be sure fields are separated by a space
        let tokens = line.split(/\s+/);
        tokens.map(t=>[t[0],t.slice(1)]).forEach(tp=>{params[tp[0]]=Number(tp[1])});
        return params;
    }
};

// Return the class for both environments to use
return CNCEmulator;

}));
