var G = 0.3;
var zoom = 2;
var earth = new Body(new Point(0, 0),      new Vector(0, 0), 1200, 28, 'earth.gif');
var moon  = new Body(new Point(0.5, -360), new Vector(1, 0),  200, 15, 'moon.gif');
var massiveBodies = [earth, moon];
var satelliteImage = new Image();
satelliteImage.src = 'data:image/svg+xml,' + escape('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><circle fill="#FFF" cx="2" cy="2" r="2"/></svg>');
var satellites = [];
var ctx = document.getElementById('satellites').getContext('2d');
var lastMouseDownPoint = null;
var elCount = document.getElementById('count');

var bodyImagesRemainingToLoad = 2;
function onBodyImageLoaded()
{
    if (--bodyImagesRemainingToLoad == 0)
        window.requestAnimationFrame(draw);
}

function Body(pos, vel, mass, radius, urlOrImage)
{
    this.pos = pos;
    this.vel = vel;
    this.mass = mass;
    this.radius = radius;
    if (typeof(urlOrImage) === "string")
    {
        function onimgload(event)
        {
            this.img.width  = this.loadingImg.width  * zoom;
            this.img.height = this.loadingImg.height * zoom;
            var ctx = this.img.getContext('2d');
            ctx.drawImage(this.loadingImg, 0, 0, this.loadingImg.width * zoom, this.loadingImg.height * zoom);
            delete this.loadingImg;
            onBodyImageLoaded();
        }

        this.img = document.createElement("canvas");

        this.loadingImg = new Image();
        this.loadingImg.addEventListener('load', onimgload.bind(this), false);
        this.loadingImg.src = urlOrImage;
    }
    else
    {
        this.img = urlOrImage;
    }
}

Body.prototype.draw = function Body_draw()
{
    var screenPt = this.pos.toScreen();
    ctx.drawImage(this.img, screenPt.x - this.img.width / 2, screenPt.y - this.img.height / 2);
}

Body.prototype.move = function Body_move()
{
    for (var i = 0; i < massiveBodies.length; i++)
    {
        var body = massiveBodies[i];
        if (body == this)
            continue;
        this.vel.addInplace(body.acceleration(this.pos));
    }
    this.pos.addInplace(this.vel);
}

Body.prototype.acceleration = function Body_acceleration(pos)
{
    var dir = this.pos.sub(pos);
    var mag = (G * this.mass) / dir.magSquared();
    return dir.normalize().mult(mag);
}

Body.prototype.checkCollisions = function Body_checkCollisions()
{
    for (var i = 0; i < massiveBodies.length; i++)
    {
        var body = massiveBodies[i];
        if (this.pos.sub(body.pos).magSquared() < (body.radius * body.radius))
            return true;
    }
    return false;
}

function Point(x, y)
{
    this.x = x;
    this.y = y;
}

Point.prototype.add = function Point_add(v)
{
    return new Point(this.x + v.dx, this.y + v.dy);
}

Point.prototype.addInplace = function Point_addInplace(v)
{
    this.x += v.dx;
    this.y += v.dy;
}

Point.prototype.sub = function Point_sub(p)
{
    return new Vector(this.x - p.x, this.y - p.y);
}

Point.prototype.toScreen = function Point_toScreen()
{
    return new Point(this.x + (ctx.canvas.width / 2), -this.y + (ctx.canvas.height / 2));
}

Point.prototype.fromScreen = function Point_fromScreen()
{
    return new Point(this.x - (ctx.canvas.width / 2), -this.y + (ctx.canvas.height / 2));
}

function Vector(dx, dy)
{
    this.dx = dx;
    this.dy = dy;
}

Vector.prototype.magSquared = function Vector_magSquared()
{
    return (this.dx * this.dx) + (this.dy * this.dy);
}

Vector.prototype.mag = function Vector_mag()
{
    return Math.sqrt(this.magSquared());
}

Vector.prototype.add = function Vector_add(v)
{
    return new Vector(this.dx + v.dx, this.dy + v.dy);
}

Vector.prototype.addInplace = function Vector_addInplace(v)
{
    this.dx += v.dx;
    this.dy += v.dy;
}

Vector.prototype.mult = function Vector_mult(c)
{
    return new Vector(this.dx * c, this.dy * c);
}

Vector.prototype.div = function Vector_div(c)
{
    return new Vector(this.dx / c, this.dy / c);
}

Vector.prototype.normalize = function Vector_normalize()
{
    return this.div(this.mag());
}

function draw()
{
    window.requestAnimationFrame(draw);
    try
    {
        // Move everything
        for (var i = 0; i < satellites.length; i++)
            satellites[i].move();
        moon.move();

        // Remove all satellites that collided with the Earth or Moon
        // or have been gotten too far away.
        var newSatellites = [];
        for (var i = 0; i < satellites.length; i++)
        {
            var sat = satellites[i];
            if (!sat.checkCollisions() && sat.pos.sub(earth.pos).magSquared() < 500000)
                newSatellites.push(sat);
        }
        satellites = newSatellites;

        // Paint background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        earth.draw();

        // Moon's orbit
        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 360, 0, 2 * Math.PI);
        ctx.strokeStyle = '#606060';
        ctx.stroke();
        moon.draw();

        // Draw satellites
        for (var i = 0; i < satellites.length; i++)
            satellites[i].draw();

        elCount.textContent = satellites.length;
    } catch (e) {
        console.error(e);
    }
}

ctx.canvas.addEventListener('mousedown', function satellites_onmousedown(event)
{
    lastMouseDownPoint = new Point(event.offsetX, event.offsetY).fromScreen();
}, false);

ctx.canvas.addEventListener('mouseup', function satellites_onmouseup(event)
{
    var mouseUpPoint = new Point(event.offsetX, event.offsetY).fromScreen();
    satellites.push(new Body(lastMouseDownPoint, mouseUpPoint.sub(lastMouseDownPoint).div(10), 0, 0, satelliteImage));
}, false);
