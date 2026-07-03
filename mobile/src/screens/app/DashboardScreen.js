import { RefreshControl, ScrollView, View, StatusBar, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';
import { useDashboard } from '../../hooks/useDashboard';
import { 
  DashboardHeader, 
  DashboardStats, 
  DashboardProgress, 
  DashboardSections 
} from './components/DashboardComponents';

export default function DashboardScreen({ navigation }) {
  const {
    user,
    lastAvatar,
    stats,
    tugasDeadline,
    tugasTerlewat,
    tugasMingguIni,
    tugasHariIni,
    isLoading,
    refreshing,
    handleRefresh,
    handleScroll,
    goToTasks
  } = useDashboard(navigation);

  const handleTaskPress = (taskId, status = 'SEDANG_DIKERJAKAN') => {
    navigation.navigate('Tugas', { 
      highlightId: taskId,
      initialFilter: { status: status }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      <DashboardHeader 
        user={user} 
        lastAvatar={lastAvatar}
        onProfilePress={() => navigation.navigate('Profil')} 
      />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            tintColor={COLORS.primary} 
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <DashboardStats 
          stats={stats} 
          tugasMingguIniCount={tugasMingguIni.length} 
          isLoading={isLoading} 
          onStatPress={goToTasks}
        />

        <DashboardSections 
          tugasTerlewat={tugasTerlewat}
          tugasDeadline={tugasDeadline}
          tugasHariIni={tugasHariIni}
          onTaskPress={handleTaskPress}
          onSectionPress={goToTasks}
          isLoading={isLoading}
        />

        <DashboardProgress 
          stats={stats} 
          isLoading={isLoading} 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30 },
});
