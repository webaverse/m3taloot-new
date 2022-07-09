

    return (
      <div className="selector-container" style={selectorContainer}>
        {templateInfo?.traitsDirectory && (
          <Stack
            direction="row"
            spacing={2}
            justifyContent="left"
            alignItems="left"
            divider={<Divider orientation="vertical" flexItem />}
          >
            {category === "color" ? (
              <Slider
                defaultValue={255}
                valueLabelDisplay="off"
                step={1}
                max={255}
                min={0}
                onChange={handleChangeSkin}
                sx={{ width: "50%", margin: "30px 0" }}
              />
            ) : (
              <React.Fragment>
                <div
                  style={selectorButton}
                  className={`selector-button ${noTrait ? "active" : ""}`}
                  onClick={() => selectTrait("0")}
                >
                  <Avatar className="icon">
                    <DoNotDisturbIcon />
                  </Avatar>
                </div>
                {collection &&
                  collection.map((item: any, index) => {
                    return (
                      <div
                        key={index}
                        style={selectorButton}
                        className={`selector-button coll-${traitName} ${selectValue === item?.id ? "active" : ""
                          }`}
                        onClick={() => {
                          if (category === "base") {
                            setLoaded(true)
                            setTempInfo(item.id)
                          }
                          selectTrait(item)
                        }}
                      >
                        <Avatar
                          className="icon"
                          src={
                            item.thumbnailsDirectory
                              ? item.thumbnail
                              : `${templateInfo?.thumbnailsDirectory}${item?.thumbnail}`
                          }
                        />
                        {selectValue === item?.id && loadingTrait > 0 && (
                          <Typography
                            className="loading-trait"
                            style={loadingTraitStyle}
                          >
                            {loadingTrait}%
                          </Typography>
                        )}
                      </div>
                    )
                  })}
                <div style={{ visibility: "hidden" }}>
                  <Avatar className="icon" />
                </div>
              </React.Fragment>
            )}
          </Stack>
        )}
        <div
          className={
            loadingTraitOverlay
              ? "loading-trait-overlay show"
              : "loading-trait-overlay"
          }
          style={
            loadingTraitOverlay ? loadingTraitOverlayStyle : { display: "none" }
          }
        />
      </div>
    )
  }
