package backend

import (
	"fmt"
	"net/http"
	"time"

	"github.com/RadhiFadlillah/duit/internal/backend/api"
	"github.com/RadhiFadlillah/duit/internal/backend/auth"
	"github.com/RadhiFadlillah/duit/internal/backend/ui"
	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/julienschmidt/httprouter"
	"github.com/sirupsen/logrus"
)

// ServeApp serves web app in specified port
func ServeApp(db *sqlx.DB, port int) error {
	// Prepare authenticator and handler
	auth, err := auth.NewAuthenticator(db, authenticationRules)
	if err != nil {
		return fmt.Errorf("failed to create authenticator: %w", err)
	}

	uiHdl, err := ui.NewHandler(auth)
	if err != nil {
		return fmt.Errorf("failed to create UI handler: %w", err)
	}

	apiHdl, err := api.NewHandler(db, auth)
	if err != nil {
		return fmt.Errorf("failed to create API handler: %w", err)
	}

	// Create router
	router := httprouter.New()

	router.GET("/", uiHdl.ServeIndex)
	router.GET("/login", uiHdl.ServeLogin)
	router.GET("/js/*filepath", uiHdl.ServeJsFile)
	router.GET("/res/*filepath", uiHdl.ServeFile)
	router.GET("/css/*filepath", uiHdl.ServeFile)

	router.POST("/api/login", apiHdl.Login)
	router.POST("/api/logout", apiHdl.Logout)

	router.GET("/api/users", apiHdl.SelectUsers)
	router.POST("/api/user", apiHdl.InsertUser)
	router.DELETE("/api/users", apiHdl.DeleteUsers)
	router.PUT("/api/user", apiHdl.UpdateUser)
	router.PUT("/api/user/password", apiHdl.ChangeUserPassword)
	router.PUT("/api/user/password/reset", apiHdl.ResetUserPassword)

	router.GET("/api/accounts", apiHdl.SelectAccounts)
	router.POST("/api/account", apiHdl.InsertAccount)
	router.PUT("/api/account", apiHdl.UpdateAccount)
	router.DELETE("/api/accounts", apiHdl.DeleteAccounts)

	router.GET("/api/entries", apiHdl.SelectEntries)
	router.POST("/api/entry", apiHdl.InsertEntry)
	router.PUT("/api/entry", apiHdl.UpdateEntry)
	router.DELETE("/api/entries", apiHdl.DeleteEntries)

	router.GET("/api/charts", apiHdl.GetChartsData)

	// Route for panic
	router.PanicHandler = func(w http.ResponseWriter, r *http.Request, arg interface{}) {
		http.Error(w, fmt.Sprint(arg), 500)
	}

	// Create server
	url := fmt.Sprintf(":%d", port)
	svr := &http.Server{
		Addr:         url,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: time.Minute,
	}

	// Serve app
	logrus.Infoln("Serve app in", url)
	return svr.ListenAndServe()
}

func authenticationRules(user model.User, method, url string) bool {
	return true
}
