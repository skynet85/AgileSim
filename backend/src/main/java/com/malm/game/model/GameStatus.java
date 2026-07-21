package com.malm.game.model;

import java.util.List;

public class GameStatus {
    private String phase;
    private String currentPlayer;
    private List<String> board;
    private int p1PiecesLeft;
    private int p2PiecesLeft;
    private String winner;

    public GameStatus() {}

    public GameStatus(String phase, String currentPlayer, List<String> board, int p1PiecesLeft, int p2PiecesLeft, String winner) {
        this.phase = phase;
        this.currentPlayer = currentPlayer;
        this.board = board;
        this.p1PiecesLeft = p1PiecesLeft;
        this.p2PiecesLeft = p2PiecesLeft;
        this.winner = winner;
    }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }
    public String getCurrentPlayer() { return currentPlayer; }
    public void setCurrentPlayer(String currentPlayer) { this.currentPlayer = currentPlayer; }
    public List<String> getBoard() { return board; }
    public void setBoard(List<String> board) { this.board = board; }
    public int getP1PiecesLeft() { return p1PiecesLeft; }
    public void setP1PiecesLeft(int p1PiecesLeft) { this.p1PiecesLeft = p1PiecesLeft; }
    public int getP2PiecesLeft() { return p2PiecesLeft; }
    public void setP2PiecesLeft(int p2PiecesLeft) { this.p2PiecesLeft = p2PiecesLeft; }
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }
}