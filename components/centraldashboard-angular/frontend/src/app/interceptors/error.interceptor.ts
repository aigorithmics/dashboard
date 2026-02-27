import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CDBBackendService } from '../services/backend.service';
// import { SnackBarConfig, SnackBarService, SnackType } from 'kubeflow';
//todo - to fix after kubernetes client library is upgraded

export function HeadersInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authReq = request.clone({
    headers: request.headers.set('Content-Type', 'application/json')
        .set('Strict-Transport-Security', '31536000')
  })
    return next(authReq);
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private backendService = inject(CDBBackendService);
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next
      .handle(request)
      .pipe(catchError(error => this.handleError(error)));
  }

  public handleError(
    error: HttpErrorResponse,
    showSnackBar = true,
  ): Observable<never> {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong,
    console.error(error);
    if (error.status) {
      this.router.navigateByUrl(this.backendService.logoutUrl())
    }

    return throwError(this.getErrorMessage(error));
  }

  public getSnackErrorMessage(
    error: HttpErrorResponse | ErrorEvent | string,
  ): string {
    if (typeof error === 'string') {
      return $localize`An error occurred: ${error}`;
    }

    if (error.error instanceof ErrorEvent) {
      return $localize`Client error: ${error.error.message}`;
    }

    if (error instanceof HttpErrorResponse) {
      // In case of status code 0 or negative, Http module couldn't
      // connect to the backend
      if (error.status <= 0) {
        return $localize`Could not connect to the backend.`;
      }

      return `[${error.status}] ${this.getBackendErrorLog(error)}\n${
        error.url
      }`;
    }

    if (error instanceof ErrorEvent) {
      return error.message;
    }

    return $localize`Unexpected error encountered`;
  }

  public getBackendErrorLog(error: HttpErrorResponse): string {
    if (error.error === null) {
      return error.message;
    }
    // Show the message the backend has sent
    else if (error.error.log) {
      return error.error.log;
    } else if (error.error.error) {
      return error.error.error;
    } else {
      return error.error;
    }
  }

  public getErrorMessage(
    error: HttpErrorResponse | ErrorEvent | string,
  ): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      const errorLog = this.getBackendErrorLog(error);
      if (errorLog !== undefined) {
        return errorLog;
      }

      return `${error.status}: ${error.message}`;
    }

    if (error instanceof ErrorEvent) {
      return error.message;
    }

    return `Unexpected error encountered`;
  }
}