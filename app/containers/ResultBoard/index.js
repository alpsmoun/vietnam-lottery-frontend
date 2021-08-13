import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
/** material ui */
import { Grid } from "@material-ui/core";
import { Star, Timer } from "@material-ui/icons";
/** common lib */
import io from "socket.io-client";
import _ from "lodash";
/** utils & constants */
import { getUserInfo } from "../../redux/actions/auth";
import { getGameLatestResult, getNewGameInfo, getGameHistory } from "../../redux/actions/game";
import { setDate } from "../../util/lib";
import { API_URL } from "../../constants/config";

const socket = io.connect(API_URL);

const ResultBoard = (props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { authenticated } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.user);
  const { currentGameType, currentBetType, currentDigitType } = useSelector((state) => state.game);
  const [result, setResult] = useState({});
  const [gameInfo, setGameInfo] = useState({});
  const [duration, setDuration] = useState({
    hours: "...",
    minutes: "...",
    seconds: "...",
  });
  
  const getNewResult = () => {
    dispatch(getGameLatestResult(currentGameType.value))
      .then((res) => {
        if (res) {
          setResult(res);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const getNewGame = () => {
    dispatch(getNewGameInfo(currentGameType.value))
      .then((res) => {
        setGameInfo(res);
      })
      .catch((err) => {
        console.error(err);
      });
  };
  
  useEffect(() => {
    socket.emit("subscribe_timer", currentGameType.value);
    socket.on("new game start", () => {
      if (authenticated) {
        getNewGame();
        dispatch(getUserInfo(user._id));
        dispatch(getGameHistory(currentGameType.value));
        getNewResult();
      }
      console.log("New game start");
    });
  }, []);

  useEffect(() => {
    getNewResult();
    getNewGame();
    socket.on(
      "timer",
      (distance) => {
        setDuration({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      },
      []
    );
    return () => {
      setDuration({
        days: "...",
        hours: "...",
        minutes: "...",
        seconds: "...",
      });
    };
  }, []);

  return (
    <div className="__result_board_main">
      <Grid container spacing={1}>
        <Grid item lg={4} md={4} sm={12} xs={12} className="title__area">
          <p className="game__title">{currentGameType.label}</p>
          <p className="betting__type">
            {currentBetType.label} {">"} {currentDigitType.label}
          </p>
        </Grid>
        <Grid item lg={4} md={4} sm={12} xs={12} className="timer__area">
          <div className="item_row">
            <Timer style={{ color: "white" }} />
            <p style={{ color: "white" }}>{t("result_board.bet_time")}</p>
          </div>
          <div className="item_row">
            <p style={{ color: "white" }}>{t("result_board.lottery_draw")}&nbsp;</p>
            <p style={{ color: "rgb(255, 136, 1)" }}>{setDate(gameInfo.endTime)}</p>
          </div>
          <div className="number_area" style={{ marginTop: 15 }}>
            <div className="duration__circle" key="DURATION_HOURS">
              <h6 style={{ color: "white" }}>{duration.hours < 0 ? "..." : duration.hours}</h6>
            </div>
            <h6 className="date_text" style={{ padding: 0, display: "flex", alignItems: "center" }}>
              :
            </h6>
            <div className="duration__circle" key="DURATION_MINUTES">
              <h6 style={{ color: "white" }}>{duration.minutes < 0 ? "..." : duration.minutes}</h6>
            </div>
            <h6 className="date_text" style={{ padding: 0, display: "flex", alignItems: "center" }}>
              :
            </h6>
            <div className="duration__circle" key="DURATION_SECONDS">
              <h6 style={{ color: "white" }}>{duration.seconds < 0 ? "..." : duration.seconds}</h6>
            </div>
          </div>
        </Grid>
        <Grid item lg={4} md={4} sm={12} xs={12} className="result_area">
          <div className="item_row">
            <Star style={{ color: "white" }} />
            <p style={{ color: "white" }}>{t("result_board.lottery_result")}</p>
          </div>
          <p style={{ color: "rgb(255, 136, 1)", alignItems: "center" }}>{setDate(result.endTime)}</p>
          <div className="number_area">
            {result.numbers
              ? result.numbers.redAward.split("").map((item, index) => (
                  <div className="number__circle" key={`RESULT_${index}`}>
                    <h6 style={{ color: "white" }}>{item}</h6>
                  </div>
                ))
              : _.range(0, 5).map((item, index) => (
                  <div className="number__circle" key={`RESULT_${index}`}>
                    <h6 style={{ color: "white" }}>_</h6>
                  </div>
                ))}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default ResultBoard;
