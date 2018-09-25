/**
 *
 *   YACA (Yet Another Cube Applet)
 *
 *   HIGLY INSPIRED BY:
 *   https://codepen.io/desandro/pen/KRWjzm
 *   TODO GIVE CREDITS !!!
 *
 *
 *
 * Params:
 *  cube: cube type, default: '3x3x3'
 *  size: cube size in px, if not given the div will expand at 100%
 *  layout: basic color layout, default 'wyorgb' (map to faces: UDLRFB)
 *  rx: starting X rotation (deg), default: +25
 *  ry: starting Y rotation (deg), default: -35
 *  U, D, L, R, F, B: colors for each face, ex: U='yyyywyyyy'
 *  perspective: 3D perespective (px), default: 500
 *  dragable: 'yes' or 'no' to enable/disable cube rotation, default: 'yes'
 * 
 * 
 */



document.addEventListener('DOMContentLoaded', function() {
    // augment all DIV tags having the .yaca class
    let i, elems = document.querySelectorAll('div.yaca')
    for (i = 0; i < elems.length; i++) {
        new Cube(elems[i])
    }
})


class Cube {
    constructor(el, options) { let self = this
        // collect cube params (from option dict, data-param or default)
        self._extract_params(el, options || {})

        // debug
        console.log('Cube:', self.sideX, self.sideY, self.sideZ, '-',
                    self.U, self.L, self.F, self.R, self.B, self.D)

        // build the 3d scene element
        let scene = self.scene = document.createElement('div')
        scene.setAttribute('class', 'scene')
        scene.style.boxSizing = 'border-box'
        scene.style.perspective = self.perspective + 'px'
        scene.style.position = 'relative'
        scene.style.width = self.size ? self.size + 'px' : '100%'
        scene.style.height = self.size ? self.size + 'px' : '100%'
        el.appendChild(scene)

        // build the cube element (container)
        let cube = self.cube = document.createElement('div')
        cube.setAttribute('class', 'cube')
        cube.style.transformStyle = 'preserve-3d'
        cube.style.width = '100%'
        cube.style.height = '100%'
        scene.appendChild(cube)

        // calculate single tile size (in px)
        self.tile_size = cube.clientWidth / self.sideMax

        // build the 6 faces (with tiles)
        self._build_face('up', self.layout[0],
                         self.sideX, self.sideZ, 90, 0,
                         self.sideY * self.tile_size / 2, self.U)
        self._build_face('down', self.layout[1],
                         self.sideX, self.sideZ, -90, 0,
                         self.sideY * self.tile_size / 2, self.D)
        self._build_face('left', self.layout[2],
                         self.sideZ, self.sideY,   0, -90,
                         self.sideX * self.tile_size / 2, self.L)
        self._build_face('right', self.layout[3],
                         self.sideZ, self.sideY, 0, 90,
                         self.sideX * self.tile_size / 2, self.R)
        self._build_face('front', self.layout[4],
                         self.sideX, self.sideY, 0, 0,
                         self.sideZ * self.tile_size / 2, self.F)
        self._build_face('back', self.layout[5],
                         self.sideX, self.sideY, 0, 180,
                         self.sideZ * self.tile_size / 2, self.B)

        // setup events for drag-rotate (capturing the move)
        if (self.dragable == 'on' || self.dragable == 'yes') {
            cube.addEventListener('mousedown', function(ev) {
                ev.preventDefault(); return false  // prevent browser dnd
            })
            cube.addEventListener('dragstart', function(ev) {
                ev.preventDefault(); return false  // prevent browser dnd
            })
            cube.addEventListener('pointerdown', function(ev) {
                cube.addEventListener('pointermove', _ondrag)
                cube.setPointerCapture(ev.pointerId)
            })
            cube.addEventListener('pointerup', function(ev) {
                cube.removeEventListener('pointermove', _ondrag)
            })
            function _ondrag(ev) {
                self.rotate(
                    self.rx + ev.movementY * 0.35,
                    self.ry + ev.movementX * 0.35
                )
            }
        }

        // apply the initial rotation
        self.rotate(self.rx, self.ry)
    }

    _extract_params(el, options) { let self = this
        // extract from dict options, tag data-params or use defaults
        self.size = options.size || el.dataset.size || '200'
        self.cube_type = options.cube || el.dataset.cube || '3x3x3'
        self.layout = options.layout || el.dataset.layout || 'wyorgb'
        self.perspective = options.perspective || el.dataset.perspective || '500'
        self.dragable = options.dragable || el.dataset.dragable || 'yes'
        self.U = options.U || el.dataset.u || ''
        self.F = options.F || el.dataset.f || ''
        self.R = options.R || el.dataset.r || ''
        self.D = options.D || el.dataset.d || ''
        self.B = options.B || el.dataset.b || ''
        self.L = options.L || el.dataset.l || ''
        self.rx = options.rx || el.dataset.rx || '+25'
        self.ry = options.ry || el.dataset.ry || '-35'
        if (self.cube_type) {
            let sides = self.cube_type.split('x')
            self.sideX = parseInt(sides[0])
            self.sideY = parseInt(sides[1])
            self.sideZ = parseInt(sides[2])
        } else {
            self.sideX = self.sideY = self.sideZ = 3
        }
        self._parse_content(el)
        self.sideMax = Math.max(self.sideX, self.sideY, self.sideZ)
        self.rx = parseFloat(self.rx)
        self.ry = parseFloat(self.ry)
    }

    _parse_content(elem) { let self = this
        let text = elem.textContent
        if (! /[a-zA-Z]/.test(text))  // is there something to parse?
            return false

        let lines = text.split('\n'),
            clean = [],
            line, i

        // cleanup white-spaces on each line and purge empty lines
        for (i = 0; i < lines.length; i++) {
            line = lines[i].replace(/\s+/g, '')
            if (line) clean.push(line)
        }
        if (!clean.length)
            return false

        // infer cube sizes from the cleaned draw
        let sx = clean[0].length,
            sz = 1, sy
        while(clean[sz].length == sx) sz++
        sy = clean.length - sz * 2

        // extract all sticker colors
        self.U = self.F = self.R = self.D = self.B = self.L = ''
        let ox, oy, char

        oy = 0; ox = 0  // Up
        for (line = oy; line < oy + sz; line++)
            for (char = ox; char < ox + sx; char++)
                self.U += clean[line][char]

        oy = sz; ox = sz  // Front
        for (line = oy; line < oy + sy; line++)
            for (char = ox; char < ox + sx; char++)
                self.F += clean[line][char]

        oy = sz; ox = sx + sz  // Right
        for (line = oy; line < oy + sy; line++)
            for (char = ox; char < ox + sz; char++)
                self.R += clean[line][char]

        oy = sy + sz; ox = 0  // Down
        for (line = oy; line < oy + sz; line++)
            for (char = ox; char < ox + sx; char++)
                self.D += clean[line][char]

        oy = sz; ox = sz + sz + sx  // Back
        for (line = oy; line < oy + sy; line++)
            for (char = ox; char < ox + sx; char++)
                self.B += clean[line][char]

        oy = sz; ox = 0  // Left
        for (line = oy; line < oy + sy; line++)
            for (char = ox; char < ox + sz; char++)
                self.L += clean[line][char]

        self.sideX = sx
        self.sideY = sy
        self.sideZ = sz

        // cleanup the parsed text from the tag
        elem.textContent = ''

        //console.log('SIDES:', self.sideX, self.sideY, self.sideX)
        return true
    }

    _build_face(name, color, sidex, sidey, rx, ry, h, tiles) { let self = this
        // face grid container
        let face = document.createElement('div')
        face.setAttribute('class', 'face ' + name)
        face.style.position = 'absolute'
        face.style.boxSizing = 'border-box'
        face.style.width = self.tile_size * sidex + 'px'
        face.style.height = self.tile_size * sidey + 'px'
        face.style.left = (((self.tile_size * self.sideMax) - (self.tile_size * sidex)) / 2) + 'px'
        face.style.top = (((self.tile_size * self.sideMax) - (self.tile_size * sidey)) / 2) + 'px'
        face.style.display = 'grid'
        face.style.gridTemplateColumns = `repeat(${sidex}, 1fr)`
        face.style.gridTemplateRows    = `repeat(${sidey}, 1fr)`
        face.style.transform = `rotateX(${rx}deg)` +
                               `rotateY(${ry}deg)` +
                               `translateZ(${h}px)`
        self.cube.appendChild(face)

        // face tiles
        let x, y, letter, tile
        for (y = 0; y < sidey; y++) {
            for (x = 0; x < sidex; x++) {
                letter = tiles[y * sidex + x] || color
                tile = document.createElement('div')
                tile.setAttribute('class', 'tile ' + letter)
                face.appendChild(tile)
            }
        }
    }

    rotate(rx, ry) { let self = this
        self.rx = rx
        self.ry = ry
        self.cube.style.transform =
            `translateZ(-350px) rotateX(${-rx}deg) rotateY(${ry}deg)`
    }
}
