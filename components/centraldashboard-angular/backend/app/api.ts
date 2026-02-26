import {Router, Request, Response, NextFunction} from 'express';
import {KubernetesService} from './k8s_service';
import {Interval, MetricsService} from './metrics_service';
import {WorkgroupApi} from './api_workgroup';

export const ERRORS = {
  operation_not_supported: 'Operation not supported',
  invalid_links_config: 'Cannot load dashboard menu link',
  invalid_settings: 'Cannot load dashboard settings'
};

export function apiError(a: {res: Response, error: string, code?: number}) {
  const {res, error} = a;
  const code = a.code || 400;
  return res.status(code).json({
    error,
  });
}

export class Api {
  constructor(
      private k8sService: KubernetesService,
      private metricsService?: MetricsService,
      private workgroupApi?: WorkgroupApi,
    ) {}

  /**
   * Middleware to check if user has access to a specific namespace.
   * Users can access a namespace if they:
   * - Contain any role binding within the namespace (owner, contributor, or viewer)
   * - Are a cluster admin
   * - Are in basic auth mode (non-identity aware clusters)
   */
  private async checkNamespaceAccess(request: Request, response: Response, next: NextFunction) {
    const namespace = request.params.namespace;
    if (!namespace) {
      return apiError({
        res: response,
        code: 400,
        error: 'Namespace parameter is required',
      });
    }

    // If no workgroup API is configured, allow access (backward compatibility)
    if (!this.workgroupApi) {
      return next();
    }

    // If no user is attached to request, deny access
    if (!request.user) {
      return apiError({
        res: response,
        code: 401,
        error: 'Authentication required to access namespace activities',
      });
    }

    try {
      // For non-authenticated users in basic auth mode, allow access
      if (!request.user.hasAuth) {
        return next();
      }

      // Get user's workgroup information
      const workgroupInfo = await this.workgroupApi.getWorkgroupInfo(request.user);

      // Check if user is cluster admin
      if (workgroupInfo.isClusterAdmin) {
        return next();
      }

      // Check if user has access to the specific namespace
      const hasAccess = workgroupInfo.namespaces.some(
        binding => binding.namespace === namespace
      );

      if (!hasAccess) {
        return apiError({
          res: response,
          code: 403,
          error: `Access denied. You do not have permission to view activities for namespace '${namespace}'.`,
        });
      }

      next();
    } catch (error) {
      console.error('Error checking namespace access:', error);
      return apiError({
        res: response,
        code: 500,
        error: 'Unable to verify namespace access permissions',
      });
    }
  }

  /**
   * Returns the Express router for the API routes.
   */
  routes(): Router {
    return Router()
        .get(
            '/metrics/:type', 
            async (req: Request, res: Response) => {
              const { type } = req.params;
              const validTypes = ['node', 'podcpu', 'podmem'];
              if (!validTypes.includes(type as string)) {
                  return res.status(400).json({ 
                      error: `Invalid metric type. Expected one of: ${validTypes.join(', ')}` 
                  });
              }
                if (!this.metricsService) {
                    return apiError({
                        res, code: 405,
                        error: ERRORS.operation_not_supported,
                    });
                }

                let interval = Interval.Last15m;
                const queryInterval = req.query.interval as string;
                if (queryInterval && Interval[queryInterval as any] !== undefined) {
                    interval = Number(Interval[queryInterval as any]);
                }

                try {
                    switch (req.params.type) {
                        case 'node':
                            return res.json(await this.metricsService.getNodeCpuUtilization(interval));
                        case 'podcpu':
                            return res.json(await this.metricsService.getPodCpuUtilization(interval));
                        case 'podmem':
                            return res.json(await this.metricsService.getPodMemoryUsage(interval));
                        default:
                            return res.status(400).json({ error: "Invalid metric type" });
                    }
                } catch (e) {
                    return apiError({ res, code: 500, error: ERRORS.invalid_settings });
                }
            })
        .get(
            '/namespaces',
            async (_: Request, res: Response) => {
                res.json(await this.k8sService.getNamespaces());
            })
        .get(
            '/activities/:namespace',
            this.checkNamespaceAccess.bind(this),
            async (req: Request, res: Response) => {
                res.json(await this.k8sService.getEventsForNamespace(req.params.namespace as string));
            })
        .get(
          '/dashboard-links',
          async (_: Request, res: Response) => {
            try {
              const cm = await this.k8sService.getConfigMap();
              const links = cm.data && cm.data["links"] ? JSON.parse(cm.data["links"]) : {};
              res.json(links);
            } catch (e) {
              return apiError({ res, code: 500, error: ERRORS.invalid_links_config });
            }
          })
        .get(
          '/dashboard-settings',
          async (_: Request, res: Response) => {
            try {
              const cm = await this.k8sService.getConfigMap();
              const settings = cm.data && cm.data["settings"] ? JSON.parse(cm.data["settings"]) : {};
              res.json(settings);
            } catch (e) {
              return apiError({ res, code: 500, error: ERRORS.invalid_settings });
            }
          });
}
}
