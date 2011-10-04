$(document).ready(function () {
    drawBoard();
});

var canvas;
var context;
var blackFigures;
var whiteFigures;
var selectedFigure;
var nextMoveIsWhite = true;
var possibleMoves = [];
var moveNumber = 0;

var boardSize = 515;
var boardStep = 63;

function drawBoard() {

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    for (var x = 0.5; x < boardSize; x += boardStep) {
        context.moveTo(x, 0.5);
        context.lineTo(x, boardSize);
    }

    for (var y = 0.5; y < boardSize; y += boardStep) {
        context.moveTo(0.5, y);
        context.lineTo(boardSize, y);
    }

    context.strokeStyle = "#eee";
    context.stroke();

    var whiteKnight1 = new figure("knight", "white", 1, 7);
    var whiteKnight2 = new figure("knight", "white", 6, 7);
    var whiteRook1 = new figure("rook", "white", 0, 7);
    var whiteRook2 = new figure("rook", "white", 7, 7);
    var whiteBishop1 = new figure("bishop", "white", 2, 7);
    var whiteBishop2 = new figure("bishop", "white", 5, 7);
    var whiteQueen = new figure("queen", "white", 3, 7);
    var whiteKing = new figure("king", "white", 4, 7);

    whiteFigures = [whiteKnight1, whiteKnight2, whiteRook1, whiteRook2, whiteBishop1, whiteBishop2, whiteQueen, whiteKing];

    for (var i = 0; i < 8; i++) {
        whiteFigures.push(new figure("pawn", "white", i, 6));
    }

    $.each(whiteFigures, function (index, fig) {
        renderFigure(fig);
    });

    var blackKnight1 = new figure("knight", "black", 1, 0);
    var blackKnight2 = new figure("knight", "black", 6, 0);
    var blackRook1 = new figure("rook", "black", 0, 0);
    var blackRook2 = new figure("rook", "black", 7, 0);
    var blackBishop1 = new figure("bishop", "black", 2, 0);
    var blackBishop2 = new figure("bishop", "black", 5, 0);
    var blackQueen = new figure("queen", "black", 3, 0);
    var blackKing = new figure("king", "black", 4, 0);

    blackFigures = [blackKnight1, blackKnight2, blackRook1, blackRook2, blackBishop1, blackBishop2, blackQueen, blackKing];

    for (var i = 0; i < 8; i++) {
        blackFigures.push(new figure("pawn", "black", i, 1));
    }

    $.each(blackFigures, function (index, fig) {
        renderFigure(fig);
    });

    canvas.addEventListener("click", canvasClick, false);
}

function canvasClick(e) {
    var cell = getCursorPosition(e);
    var handled;
    $.each(blackFigures, function (index, fig) {
        if (fig.column == cell.column && fig.row == cell.row) {
            pieceClicked(fig);
            handled = true;
            return false;
        }
    });

    $.each(whiteFigures, function (index, fig) {
        if (fig.column == cell.column && fig.row == cell.row) {
            pieceClicked(fig);
            handled = true;
            return false;
        }
    });

    if (!handled)
        emptyCellClicked(cell.row, cell.column);
}

function performMove(move, figure) {
    removeSelectionNoDraw(figure.row, figure.column);

    $.each(possibleMoves, function (index, move) {
        removeSelection(move.row, move.column);
    });
    possibleMoves = [];

    figure.column = move.column;
    figure.row = move.row;
    renderFigure(figure);
    if (figure.type === 'king')
        figure.hasMoved = true;

    nextMoveIsWhite = !nextMoveIsWhite;

    if (nextMoveIsWhite) {
        var cell = $("<td></td>").html(moveToText(move));
        $("#notation table tr:last").append(cell);
    }
    else {
        moveNumber++;
        var cell = $("<td></td>").html(moveNumber + "." + moveToText(move));
        var row = $("<tr></tr>").html(cell);
        $("#notation table tr:last").after(row);
    }
}

function emptyCellClicked(row, column) {
    log('empty cell clicked ' + row + " - " + column);

    if (selectedFigure) {
        selectedFigure.selected = false;
        removeSelection(selectedFigure.row, selectedFigure.column);
        selectedFigure = "";
    }

    var found;

    $.each(possibleMoves, function (index, move) {
        if (move.row === row && move.column === column) {

            var figure = getFigure(move.oldRow, move.oldColumn);
            if (figure) {
                performMove(move, figure);
            }

            found = true;
            return false;
        }
    });

    if (!found) {
        $.each(possibleMoves, function (index, move) {
            removeSelection(move.row, move.column);
        });
        possibleMoves = [];
    }
}

function pieceClicked(figure) {

    log("piece clicked " + figure.row + " - " + figure.column);

    if (nextMoveIsWhite && figure.color === 'black')
        return;

    if (!nextMoveIsWhite && figure.color === 'white')
        return;

    $.each(possibleMoves, function (index, move) {
        removeSelection(move.row, move.column);
    });
    possibleMoves = [];

    if (selectedFigure) {

        selectedFigure.selected = false;
        removeSelection(selectedFigure.row, selectedFigure.column);

        if (selectedFigure === figure) {
            selectedFigure = "";
            return;
        }
    }
    else {
        removeSelection(figure.row, figure.column);
    }

    figure.selected = true;
    selectCell(figure);
    selectedFigure = figure;

    pushPossibleMoves(figure);

    $.each(possibleMoves, function (index, move) {
        colorPossibleMove(move.row, move.column);
    });
}

function pushPossibleMoves(figure) {
    switch (figure.type) {
        case 'pawn':
            {
                if (figure.color === 'white') {
                    if (figure.row == 6) {
                        pushPossibleMove(figure, -1, 0);

                        var possibleFigureObstructing = getFigure(figure.row - 1, figure.column);
                        if (!possibleFigureObstructing)
                            pushPossibleMove(figure, -2, 0);
                    }
                    else {
                        pushPossibleMove(figure, -1, 0);
                    }
                }
                else {
                    if (figure.row == 1) {
                        pushPossibleMove(figure, 1, 0);

                        var possibleFigureObstructing = getFigure(figure.row + 1, figure.column);
                        if (!possibleFigureObstructing)
                            pushPossibleMove(figure, 2, 0);
                    }
                    else {
                        pushPossibleMove(figure, 1, 0);
                    }
                }
                break;
            }
        case 'knight':
            {
                pushPossibleMove(figure, 1, 2);
                pushPossibleMove(figure, 1, -2);
                pushPossibleMove(figure, -1, 2);
                pushPossibleMove(figure, -1, -2);
                pushPossibleMove(figure, 2, 1);
                pushPossibleMove(figure, 2, -1);
                pushPossibleMove(figure, -2, 1);
                pushPossibleMove(figure, -2, -1);
                break;
            }
        case 'rook':
            {
                rookMovements(figure);
                break;
            }
        case 'king':
            {
                pushPossibleMove(figure, 0, 1);
                pushPossibleMove(figure, 0, -1);
                pushPossibleMove(figure, 1, 0);
                pushPossibleMove(figure, 1, -1);
                pushPossibleMove(figure, 1, 1);
                pushPossibleMove(figure, -1, 0);
                pushPossibleMove(figure, -1, -1);
                pushPossibleMove(figure, -1, 1);

                if (!figure.hasMoved) {
                    if ((figure.row === 7 || figure.row === 0) && figure.column === 4) {
                        var rightRook = getFigure(figure.row, 7);
                        if (rightRook && rightRook.type === 'rook')
                            pushPossibleMove(figure, 0, 2);

                        var leftRook = getFigure(figure.row, 0);
                        if (leftRook && leftRook.type === 'rook')
                            pushPossibleMove(figure, 0, -2);
                    }
                }

                break;
            }
        case 'queen':
            {
                rookMovements(figure);
                bishopMovements(figure);
                break;
            }
        case 'bishop':
            {
                bishopMovements(figure);
                break;
            }
    }
}

function bishopMovements(figure) {
    if (figure.row > 0) {
        for (var i = figure.row - 1; i >= 0; i--) {
            var r = i;
            var c = figure.column - figure.row + i;
            if (!pushPossibleMove(figure, r - figure.row, c - figure.column))
                break;
        }
    }

    if (figure.row < 7) {
        for (var i = figure.row + 1; i <= 7; i++) {
            var r = i;
            var c = figure.column - figure.row + i;
            if (!pushPossibleMove(figure, r - figure.row, c - figure.column))
                break;
        }
    }

    if (figure.column < 7) {
        for (var i = figure.column + 1; i <= 7; i++) {
            var c = i;
            var r = figure.row + figure.column - i;
            if (!pushPossibleMove(figure, r - figure.row, c - figure.column))
                break;
        }
    }

    if (figure.column > 0) {
        for (var i = figure.column - 1; i >= 0; i--) {
            var c = i;
            var r = figure.row + figure.column - i;
            if (!pushPossibleMove(figure, r - figure.row, c - figure.column))
                break;
        }
    }
}

function rookMovements(figure) {
    if (figure.row > 0) {
        for (var i = figure.row - 1; i >= 0; i--) {
            if (!pushPossibleMove(figure, i - figure.row, 0))
                break;
        }
    }

    if (figure.row < 7) {
        for (var i = figure.row + 1; i <= 7; i++) {
            if (!pushPossibleMove(figure, i - figure.row, 0))
                break;
        }
    }

    if (figure.column < 7) {
        for (var i = figure.column + 1; i <= 7; i++) {
            if (!pushPossibleMove(figure, 0, i - figure.column))
                break;
        }
    }

    if (figure.column > 0) {
        for (var i = figure.column - 1; i >= 0; i--) {
            if (!pushPossibleMove(figure, 0, i - figure.column))
                break;
        }
    }
}

function pushPossibleMove(figure, rowOffset, columnOffset) {

    var move = new Move(figure.row, figure.column, figure.row + rowOffset, figure.column + columnOffset);

    if (move.row > 7 || move.column > 7 || move.row < 0 || move.column < 0)
        return false;

    var offendingFigure = getFigure(move.row, move.column);
    if (!offendingFigure)
        possibleMoves.push(move);

    return !offendingFigure;
}

function colorPossibleMove(row, column) {
    context.fillStyle = "#B4CDCD";
    context.fillRect((column * boardStep) + 1, (row * boardStep) + 1, boardStep - 1, boardStep - 1);
}

function selectCell(figure) {
    context.fillStyle = "#FF4500";
    context.fillRect((figure.column * boardStep) + 1, (figure.row * boardStep) + 1, boardStep - 1, boardStep - 1);
    renderFigure(figure);
}

function removeSelection(row, column) {
    context.fillStyle = "#FFFFFF";
    context.fillRect((column * boardStep) + 1, (row * boardStep) + 1, boardStep - 1, boardStep - 1);

    var figure = getFigure(row, column);
    if (figure)
        renderFigure(figure);
}

function removeSelectionNoDraw(row, column) {
    context.fillStyle = "#FFFFFF";
    context.fillRect((column * boardStep) + 1, (row * boardStep) + 1, boardStep - 1, boardStep - 1);
}

function renderFigure(figure) {
    if (!figure.imageObj) {
        figure.imageObj = new Image();
        figure.imageObj.src = figure.image;

        figure.imageObj.onload = function () {
            context.drawImage(figure.imageObj, figure.column * boardStep, figure.row * boardStep, boardStep, boardStep);
        };
    }
    else {
        context.drawImage(figure.imageObj, figure.column * boardStep, figure.row * boardStep, boardStep, boardStep);
    }
}

function figure(type, color, column, row) {
    this.type = type;
    this.image = "images/" + color + "-" + type + ".png";
    this.column = column;
    this.row = row;
    this.color = color;
    this.selected = false;
}

function Cell(row, column) {
    this.row = row;
    this.column = column;
}

function Move(oldRow, oldColumn, row, column) {
    this.oldRow = oldRow;
    this.oldColumn = oldColumn;
    this.row = row;
    this.column = column;
}

function getCursorPosition(e) {
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    x = Math.min(x, boardStep * boardStep);
    y = Math.min(y, boardStep * boardStep);
    var cell = new Cell(Math.floor(y / boardStep), Math.floor(x / boardStep));
    return cell;
}

function getFigure(row, column) {
    var selected;
    $.each(blackFigures, function (index, fig) {
        if (fig.column == column && fig.row == row) {
            selected = fig;
            return;
        }
    });

    if (selected)
        return selected;

    $.each(whiteFigures, function (index, fig) {
        if (fig.column == column && fig.row == row) {
            selected = fig;
            return;
        }
    });

    if (selected)
        return selected;
}

function moveToText(move) {
    var oldText = getRankName(move.oldColumn) + (8 - move.oldRow);
    var newText = getRankName(move.column) + (8 - move.row);

    return oldText + " - " + newText;
}

function getRankName(row) {
    return String.fromCharCode(row + 65);
}

function log(message) {
    if (console)
        console.log(message);
}