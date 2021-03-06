/**
 * Created by QAQ on 2017/3/11.
 */
var round;
var ratiox,ratioy,bw,bh;
var bars;
var colorTheme;
var stepTime,fullTime;
var username;
var roundTime,curTime;


function initSize() {
    var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    if(bw !== undefined)
        ratiox = w / bw;
    if(bh !== undefined)
        ratioy = h / bh;
    bw = w,bh = h;
    cellSize = Math.floor(Math.min(w,h)/ 30);
    boardSize = cellSize * 20;
}
function init() {
    owner = -1;
    round = -1;
    stepTime = 5,fullTime = 240;
    curTime = stepTime;
    roundTime = [fullTime,fullTime,fullTime,fullTime];
    initColorTheme();
    initSize();
    clearFace();
    createChess();
    createCorner();
    createProbar();
    initBoard();
    initChess();
    initCorner();
    initProbar();
    refreshBoard();
    refreshChess();
    refreshProbar();
    initAction();
    $(window).resize(function () {
        initSize();
        scaleChess();
        initBoard();
        initChess();
        initCorner();
        initProbar();
        refreshBoard();
        refreshChess();
        refreshCorner();
        refreshProbar();
    })
}
function initAction() {
    function getID(cx, cy) {
        for (var i in chessLocate) {
            if (isHide[i] === true) continue;
            var offx = chessLocate[i].x;
            var offy = chessLocate[i].y;
            for (var j in chessShape[i]) {
                var poi = chessShape[i][j];
                if (inreg(0, cellSize, cx - offx - cellSize * poi.x)
                    && inreg(0, cellSize, cy - offy - cellSize * poi.y))
                    return parseInt(i);
            }
        }
        return -1;
    }
    var mouseDown = false;
    var select = -1;
    var clix, cliy // mouselocetion
        , chsx, chsy //chesslocation
        , pox, poy //mouse index in board
        , centx,centy;//select chess center
    function updSelect(x) {
        if (select != -1) $("#chs_" + select).css("opacity", initp);
        select = x;
        if (select != -1) $("#chs_" + select).css("opacity", highp);
    }
    function getCent() {
        getPo();
        if (!inreg(0, cellSize * 5, clix - chsx) || !inreg(0, cellSize * 5, cliy - chsy)) {
            centx =chsx + cellSize * 2.5, centy = chsy + cellSize * 2.5;
        }
        else{
            centx = clix, centy = cliy;
        }
    }
    function getPo() {
        chsx = $("#chs_" + select).position().left;
        chsy = $("#chs_" + select).position().top;
        pox = Math.floor(0.5 + (chsx - $("#board").position().left) / cellSize);
        poy = Math.floor(0.5 + (chsy - $("#board").position().top ) / cellSize);
    }
    function moveChess(e) {
        if (select === -1) return;
        chsx -= clix - e.clientX, chsy -= cliy - e.clientY;
        moveChessTo(chsx,chsy,select);
    }
    function flipChess() {
        getCent();
        chsy = centy * 2 - cellSize * 5 - chsy;
        moveChessTo(chsx,chsy,select);

        chessState[select] = flipChessShape(chessShape[select],chessState[select]);
        refreshChess(select);
        getPo();
        inMask(select, pox, poy);
    }
    function rotateChess(ind, clix, cliy, clock) {
        getCent();
        var dx = centx - chsx, dy = centy - chsy;
        if(clock) chsx = centx - dy, chsy =  centy - (5 * cellSize - dx);
        else      chsx = centx - (5 * cellSize - dy), chsy =  centy - dx;
        moveChessTo(chsx,chsy,select);

        chessState[select] = rotateChessShape(chessShape[select],chessState[select],clock);

        refreshChess(select);
        getPo();
        inMask(select, pox, poy);
    }
    var extend = false,moved = false;
    function shadeoff(event,id,poi){
        var pos = [xy(-1,-1),xy(0,-1),xy(1,-1)
                  ,xy(-1, 0)         ,xy(1,0)
                  ,xy(-1, 1),xy(0, 1),xy(1,1)];
        var mx = (event.pageX - poi.x) / cellSize;
        var my = (event.pageY - poi.y) / cellSize;
        var sta = -1;
        for(var ind = 0 ; ind < 8 ; ind ++){
            if(inreg(pos[ind].x * 5 ,pos[ind].x * 5 + 5,mx) 
            && inreg(pos[ind].y * 5 ,pos[ind].y * 5 + 5,my)){
                sta = ind;
            }
        }
        if(sta != -1){
            if(0 != ((sta - chessState[id]) & 1))
                chessState[id] = flipChessShape(chessShape[id],chessState[id]);
             while(sta != chessState[id])
                 chessState[id] = rotateChessShape(chessShape[id],chessState[id],true);
            refreshChess(id);
        }
        getE("shade").clearRect(0,0,cellSize * 15,cellSize * 15);
    }
    function shadeon(id,poi){
        $("#shade").css({
            left:poi.x - 5 * cellSize + "px",
            top:poi.y - 5 * cellSize + "px"
        });
        var e = getE("shade");
        e.fillStyle = colorTheme.shade;
        e.fillRect(0,0,cellSize * 15,cellSize * 15);
        var chs = sCS[id].map(upd(0,0));
        var sta = 0;
        var pos = [xy(-1,-1),xy(0,-1),xy(1,-1)
                  ,xy(-1, 0)         ,xy(1,0)
                  ,xy(-1, 1),xy(0, 1),xy(1,1)];
        for(var _sta= 0 ; _sta < 8 ;_sta ++){
            if(_sta == 4)
                sta = flipChessShape(chs,sta);
            sta = rotateChessShape(chs,sta);
            var tchs = chs.map(upd(pos[sta].x*5+5,pos[sta].y*5+5));
            for(var ind in tchs){
                drawCell(tchs[ind],colorTheme.player(owner),e);
            }
            for(var ind in tchs){
                drawFrame(tchs[ind],colorTheme.frameColor,e);
            }
        }
        e.strokeStyle = "#000000";
        e.lineWidth = 1;
        e.beginPath();
        for (var i = 0; i <= 3; i++) {
            e.moveTo(i * cellSize * 5, 0), e.lineTo(i * cellSize * 5, cellSize * 15);
            e.moveTo(0, i * cellSize * 5), e.lineTo(cellSize * 15, i * cellSize * 5);
        }
        e.closePath();
        e.stroke();
    }
    function down(e){
        if(extend == true){
            shadeoff(e,select,chessLocate[select]);
        }
        else{
            mouseDown = true;
            clix = e.clientX, cliy = e.clientY;
            getE("mask").clearRect(0, 0, boardSize, boardSize);
            updSelect(getID(clix, cliy));
            if (select !== -1)
                getPo(), inMask(select, pox, poy);
            moved = false;
        }
    }
    function up(){
        getE("mask").clearRect(0, 0, boardSize, boardSize);
        mouseDown = false;
        if(extend == false && moved == false && select != -1){
            extend = true;
            shadeon(select,chessLocate[select]);
        }
        else{
            if(extend == true){
                extend = false;
            }
        }
    }
    function move(e){
        if (mouseDown === true && select !== -1) {
            getPo();
            moveChess(e);
            moved = true;
            inMask(select, pox, poy);
        }
        clix = e.clientX, cliy = e.clientY;
    }
    $("#playGround").on('mousedown',down);
    $("#playGround").on('touchstart',function (e){
        down(e.originalEvent.touches[0]);
        return false;
    });
    $("#playGround").on('mousemove',move);
    $("#playGround").on('touchmove',function (e){
        e.preventDefault();
        move(e.originalEvent.touches[0]);
    });
    $("#playGround").on('mouseup touchend',up);
    $(window).keydown(function (e) {
        if(e.keyCode == 81){ //Q
            now = now - 1;
            now = Math.max(now,0);
            boardFace = recorder[now];
            refreshBoard();
        }
        if(e.keyCode == 69){ //E
            now = now + 1;
            now = Math.min(now,recorder.length-1);
            boardFace = recorder[now];
            refreshBoard();
        }
        if (select === -1) return;
        switch (e.keyCode) {
            case 87: //w
            case 83: //s
                flipChess(select, clix, cliy);
                break;
            case 65: // a
                rotateChess(select, clix, cliy, true);
                break;
            case 68: //d
                rotateChess(select, clix, cliy, false);
                break;
            default:
                break;
        }
    });
}

function initColorTheme(theme) {
    if (theme === undefined) {
        colorTheme = {
            legal: "#6f645e",
            horn: "#a5a7a5",
            rim: "#875f5f",
            unlegal: "#e1d9c4",
            can: "#f5f9f8",
            frameColor : "#ffffff",
            shade : "#e6eae9",
            lineColor: "#e6eae9",
            player: function (o) {
                switch (o) {
                    case -1: return "#b7b7b7";
                    case 0: return "#ed1c24";
                    case 1: return "#23b14d";
                    case 2: return "#00a2e8";
                    case 3: return "#ffc90d";
                }
                return undefined;
            },
            corner: function (o) {
                switch (o) {
                    case -1: return "#e6eae9";
                    case 0: return "#cf1b24";
                    case 1: return "#239546";
                    case 2: return "#0091cf";
                    case 3: return "#ebb60d";
                }
                return undefined;
            }
        }
    }
    else {
        colorTheme = theme;
    }
}