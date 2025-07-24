package com.stanley.focusflow;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

/**
 * Home-screen widget provider for FocusFlow.
 *
 * This initial implementation shows placeholder data and basic tap actions.
 * Future iterations will hook into the app's database / services for live data
 * and support the timer background service.
 */
public class FocusFlowWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_ADD_TASK = "com.stanley.focusflow.ACTION_ADD_TASK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    /**
     * Build and push {@link RemoteViews} to the widget.
     */
    private void updateAppWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_focusflow);

        // TODO – Replace placeholders with real data from the app database / service
        views.setTextViewText(R.id.textTasks, "Today: 0 Tasks | Completed: 0");
        views.setTextViewText(R.id.textQuote, "Believe you can and you're halfway there.");

        // PendingIntent to open the app (MainActivity) when the tasks summary is tapped.
        Intent openAppIntent = new Intent(context, MainActivity.class);
        PendingIntent openAppPending = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                        ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                        : PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.textTasks, openAppPending);

        // "Add Task" button action -> broadcast to provider so the React-Native layer can open add-task screen.
        Intent addTaskIntent = new Intent(context, FocusFlowWidgetProvider.class);
        addTaskIntent.setAction(ACTION_ADD_TASK);
        PendingIntent addTaskPending = PendingIntent.getBroadcast(
                context,
                0,
                addTaskIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                        ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                        : PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.buttonAddTask, addTaskPending);

        // Quote tap opens vision board (MainActivity with extra deep-link) – placeholder
        Intent visionIntent = new Intent(context, MainActivity.class);
        visionIntent.putExtra("navigateTo", "vision-board");
        PendingIntent visionPending = PendingIntent.getActivity(
                context,
                1,
                visionIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                        ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                        : PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.textQuote, visionPending);

        manager.updateAppWidget(widgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_ADD_TASK.equals(intent.getAction())) {
            // Launch the app to the Add Task screen via MainActivity deep link intent.
            Intent addTaskScreen = new Intent(context, MainActivity.class);
            addTaskScreen.putExtra("navigateTo", "add-task");
            addTaskScreen.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(addTaskScreen);
        }

        // Force refresh all widgets when we perform an action.
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, FocusFlowWidgetProvider.class));
        onUpdate(context, manager, ids);
    }
}
