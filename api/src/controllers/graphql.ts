import { Request, Router, Response, NextFunction } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { GraphQLService } from '../services';
import { respond } from '../middleware/respond';

const router = Router();

router.use(
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const schema = await service.getSchema();

		/**
		 * @NOTE express-graphql will attempt to respond directly on the `res` object
		 * We don't want that, as that will skip our regular `respond` middleware
		 * and therefore skip the cache. This custom response object overwrites
		 * express' regular `json` function in order to trick express-graphql to
		 * use the next middleware instead of respond with data directly
		 */
		const customResponse = {
			...res,
			json: function (payload: Record<string, any>) {
				res.locals.payload = payload;
				return next();
			},
		};

		graphqlHTTP({ schema, graphiql: true })(req, customResponse as Response);
	}),
	respond
);

export default router;
